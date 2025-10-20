# /src/service/improvement_service.py
from __future__ import annotations
from typing import Optional, Tuple, List, Union, Dict, Any
import re
import os

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http.models import NamedSparseVector, SparseVector
from sklearn.feature_extraction.text import TfidfVectorizer

from src.service.metrics_service import calculate_metrics
from src.domain.models import Metrics, MetricsResponse


# ─────────────────────────────────────────────────────────────────────────────
# Helper: TF-IDF sparse search in Qdrant
# ─────────────────────────────────────────────────────────────────────────────
def search_tfidf(
    client: QdrantClient,
    collection_name: str,
    query: str,
    vectorizer,
    top_k: int = 5
):
    if client is None or vectorizer is None:
        return []
    q = vectorizer.transform([query])
    idx = q.indices.tolist()
    vals = q.data.tolist()

    results = client.search(
        collection_name=collection_name,
        query_vector=NamedSparseVector(
            name="text",  # Debe coincidir con tu sparse_vectors_config
            vector=SparseVector(indices=idx, values=vals)
        ),
        limit=top_k,
        with_payload=True
    )
    return results

# ─────────────────────────────────────────────────────────────────────────────
# ImprovementService
# ─────────────────────────────────────────────────────────────────────────────
class ImprovementService:
    def __init__(
        self,
        openai_model: str,
        qdrant_client: Optional[QdrantClient],
        qdrant_collection: Optional[str],
        vectorizer
    ):
        self.model = openai_model
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.qdrant = qdrant_client
        self.collection = qdrant_collection
        self.vectorizer = vectorizer

    # -------------------- Public API --------------------
    async def run_workflow(self, code: str) -> Tuple[str, str, List[Dict], MetricsResponse]:
        """
        1) Describe y analiza el código (variables, métodos, bucles, responsabilidades)
        2) Usa esa descripción como query TF-IDF en Qdrant para recuperar contexto (chunks)
        3) Pide recomendaciones a OpenAI
        4) Pide código mejorado a OpenAI
        5) Calculate metrics before and after code improvement
        Returns: (analysis_text, improved_code, retrieved_context_details, metrics)
        """

        print("starting workflow")

        # Calculate metrics before code improvement
        before_metrics = calculate_metrics(code)
        
        analysis_list = await self._describe_code(code)
        # Join the analysis list for display purposes
        analysis = "\n\n".join(analysis_list)
        retrieved_text, chunk_details = self._retrieve_context(analysis_list)
        recommendations = await self._recommendations(code, analysis, retrieved_text)
        improved_code = await self._refactor_code(code, recommendations, retrieved_text)

        # Calculate metrics after code improvement
        after_metrics = calculate_metrics(improved_code)
        
        # Create metrics response
        metrics_response = MetricsResponse(
            before=Metrics(
                method_number=before_metrics["method_number"],
                number_of_ifs=before_metrics["number_of_ifs"],
                number_of_loops=before_metrics["number_of_loops"],
                cyclomatic_complexity=before_metrics["cyclomatic_complexity"],
                average_method_size=before_metrics["average_method_size"]
            ),
            after=Metrics(
                method_number=after_metrics["method_number"],
                number_of_ifs=after_metrics["number_of_ifs"],
                number_of_loops=after_metrics["number_of_loops"],
                cyclomatic_complexity=after_metrics["cyclomatic_complexity"],
                average_method_size=after_metrics["average_method_size"]
            )
        )

        #print("-- Improve Code"*30)
        #print(improved_code)
        #print("--"*30)

        return analysis, improved_code, chunk_details, metrics_response

    # -------------------- Steps --------------------
    async def _describe_code(self, code: str) -> List[str]:
        """
        Pide a OpenAI que describa el código: propósito, métodos/funciones, variables,
        bucles/condiciones y posibles problemas visibles (sin cambiar comportamiento).
        
        Returns a list of descriptions for different aspects of the code.
        """
        print("Describing...")

        prompt = f"""
            You are a senior engineer. Analyze the following code and return a structured description with each aspect clearly separated.
            
            Analyze these aspects:
            1. Purpose / responsibility
            2. Public API (functions/classes)
            3. Variables and their roles
            4. Loops/conditionals and data flow
            5. Any obvious smells (too long methods, unclear names, missing docstrings)
            
            Format your response with clear section headers (e.g., "## Purpose", "## Public API", etc.) 
            so I can parse each section separately. Each section should be self-contained and meaningful on its own.
            
            Return plain text (no markdown fences)

            IMPORTANT: NEVER take care of the "execute" Function or its params because is used to perform functional tests. 

            CODE:
            {code}
            """
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=0.0,
            messages=[
                {"role": "system", "content": "Be precise and structured."},
                {"role": "user", "content": prompt}
            ]
        )

        content = resp.choices[0].message.content.strip()
        print(resp)
        
        sections = []
        
        import re
        section_pattern = r'##\s+(.*?)(?=##\s+|$)'
        matches = re.findall(section_pattern, content, re.DOTALL)
        
        if matches:
            for match in matches:
                section_text = match.strip()
                if section_text:
                    sections.append(section_text)
        else:
            lines = content.split('\n')
            current_section = []
            
            for line in lines:
                if line.strip():
                    current_section.append(line)
                elif current_section:
                    sections.append('\n'.join(current_section))
                    current_section = []
            
            if current_section:
                sections.append('\n'.join(current_section))
        
        if not sections:
            sections = [content]
            
        return sections

    def _retrieve_context(self, query_text: Union[str, List[str]]) -> Tuple[str, List[Dict]]:
        """
        Realiza retrieval en Qdrant usando TF-IDF sparse search y concatena los top chunks.
        
        Accepts either a single query string or a list of query strings.
        For a list, it performs a search for each item and combines the results.
        
        Returns:
            Tuple containing:
            - A string with concatenated text of chunks (for backward compatibility)
            - A list of dictionaries with chunk details (score, page, chunk_id, text)
        """
        print("Retrieving Context...")
        print(f"configuration : {self.qdrant} - {self.collection} - {self.vectorizer} ")

        if not self.qdrant or not self.collection or not self.vectorizer:
            return "", []
            
        all_chunks: List[str] = []
        chunk_details: List[Dict] = []
        
        queries = query_text if isinstance(query_text, list) else [query_text]
        print(f"searching data.. {queries}")


        for query in queries:
            results = search_tfidf(
                client=self.qdrant,
                collection_name=self.collection,
                query=query,
                vectorizer=self.vectorizer,
                top_k=3  
            )
            
            for r in results or []:
                payload = getattr(r, "payload", {}) or {}
                txt = payload.get("text") or ""
                
                if txt and txt not in all_chunks:
                    all_chunks.append(txt)
                    
                    chunk_details.append({
                        "score": getattr(r, "score", 0.0),
                        "page": payload.get("page"),
                        "chunk_id": payload.get("chunk_id"),
                        "text": txt
                    })
        
        print(f"Retrieved {len(all_chunks)} unique chunks")
        
        chunk_details.sort(key=lambda x: x["score"], reverse=True)
        
        chunk_details = chunk_details[:5]
        all_chunks_text = "\n\n---\n\n".join([c["text"] for c in chunk_details])
            
        return all_chunks_text, chunk_details

    async def _recommendations(self, code: str, analysis: str, retrieved: str) -> str:
        """
        Pide a OpenAI recomendaciones concretas (lista corta) para mejorar el código,
        usando el análisis y el contexto recuperado (patrones/estándares/ejemplos).
        """

        print("get recomendations ...")

        prompt = f"""
        You are a code reviewer. Based on the analysis and retrieved context, propose specific,
        actionable recommendations to improve the code while preserving behavior.

        Analysis:
        {analysis}

        Retrieved context (patterns/snippets/style guides):
        {retrieved or "(no context)"}

        Code:
        {code}

        IMPORTANT: NEVER RECOMEND CHANGE THE "execute" Function or its params because is used to perform functional tests. 

        Return 5-10 bullet points (short, actionable). No extra commentary.
        """
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=0.0,
            messages=[
                {"role": "system", "content": "Be concise and actionable."},
                {"role": "user", "content": prompt}
            ]
        )
        return resp.choices[0].message.content.strip()

    async def _refactor_code(self, code: str, recommendations: str, retrieved: str) -> str:
        """
        Pide a OpenAI que entregue SOLO el código mejorado, preservando comportamiento,
        aplicando las recomendaciones y siguiendo el contexto recuperado si aplica.
        """
        prompt = f"""
        You are a senior refactoring assistant. Improve the code while preserving functional behavior.

        Hard requirements (must comply):
        1) 'execute' is the ONLY public entry point and the MAIN orchestrator.
        2) Preserve 'execute' EXACT NAME and EXACT PARAMETER LIST (names, order, defaults, *args, **kwargs).
        3) Keep 'execute' callable by existing code and tests (same module/class location).
        4) You may create helper functions (e.g., 'main', 'run', '_impl'), BUT 'execute' must remain and call them as needed.
        5) Do NOT change 'execute' decorators or return contract (type/shape of the return value).

        Allowed changes (flexible):
        - Refactor internal logic, extract helpers, rename local variables, reorder internal steps if behavior is unchanged.
        - Improve readability, error handling, docstrings, and performance without altering observable behavior.

        Behavioral constraint:
        - The overall control flow triggered by calling 'execute(...)' must remain equivalent (same functional outcomes, same side effects order where visible to callers).

        Use the following recommendations and (optionally) the retrieved context to guide changes:
        RECOMMENDATIONS:
        {recommendations}

        RETRIEVED CONTEXT:
        {retrieved or "(no context)"}

        Output format:
        - Return ONLY the full improved code (no markdown fences, no ```python, no explanations).
        """
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=0.0,
            messages=[
                {"role": "system", "content": "Return only the raw improved code; no code block markers, no explanations."},
                {"role": "user", "content": prompt}
            ]
        )

        text = resp.choices[0].message.content or ""
        
        # Remove any markdown code block markers if they exist
        cleaned_code = re.sub(r'^```\w*\s*', '', text)
        cleaned_code = re.sub(r'```$', '', cleaned_code)
        
        return cleaned_code.strip()
