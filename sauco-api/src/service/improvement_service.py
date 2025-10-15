# /src/service/improvement_service.py
from __future__ import annotations
from typing import Optional, Tuple, List
import re
import os

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http.models import NamedSparseVector, SparseVector

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
    async def run_workflow(self, code: str) -> Tuple[str, str]:
        """
        1) Describe y analiza el código (variables, métodos, bucles, responsabilidades)
        2) Usa esa descripción como query TF-IDF en Qdrant para recuperar contexto (chunks)
        3) Pide recomendaciones a OpenAI
        4) Pide código mejorado a OpenAI
        Returns: (analysis_text, improved_code)
        """

        print("starting workflow")

        analysis = await self._describe_code(code)
        retrieved_text = self._retrieve_context(analysis)
        recommendations = await self._recommendations(code, analysis, retrieved_text)
        improved_code = await self._refactor_code(code, recommendations, retrieved_text)

        print("-- Improve Code"*30)
        print(improved_code)
        print("--"*30)

        return analysis, improved_code

    # -------------------- Steps --------------------
    async def _describe_code(self, code: str) -> str:
        """
        Pide a OpenAI que describa el código: propósito, métodos/funciones, variables,
        bucles/condiciones y posibles problemas visibles (sin cambiar comportamiento).
        """
        print("Describing...")

        prompt = f"""
            You are a senior engineer. Analyze the following code and return a concise description including:
            - Purpose / responsibility
            - Public API (functions/classes)
            - Variables and their roles
            - Loops/conditionals and data flow
            - Any obvious smells (too long methods, unclear names, missing docstrings)

            Return plain text (no markdown fences).

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

        print(resp)
        return resp.choices[0].message.content.strip()

    def _retrieve_context(self, query_text: str) -> str:
        """
        Realiza retrieval en Qdrant usando TF-IDF sparse search y concatena los top chunks.
        """

        print("Retrieving...")
        if not self.qdrant or not self.collection or not self.vectorizer:
            return ""
        results = search_tfidf(
            client=self.qdrant,
            collection_name=self.collection,
            query=query_text,
            vectorizer=self.vectorizer,
            top_k=5
        )
        chunks: List[str] = []

        print(chunks)

        for r in results or []:
            payload = getattr(r, "payload", {}) or {}
            txt = payload.get("text") or ""
            if txt:
                chunks.append(txt)

            
        return "\n\n---\n\n".join(chunks[:5])

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
            You are a senior refactoring assistant.
            Improve the following code while preserving its behavior.
            Apply these recommendations:
            {recommendations}

            Use the retrieved context if relevant:
            {retrieved or "(no context)"}

            Return the improved code in a single fenced block:
            
            <code>
            """
        resp = self.client.chat.completions.create(
        model=self.model,
        temperature=0.0,
        
        messages=[
        {"role": "system", "content": "Return only the improved code block; no explanations unless asked."},
        {"role": "user", "content": prompt}
        ]
        )

        text = resp.choices[0].message.content or ""
        m = re.search(r"(?:improved)?\s*(.*?)", text, flags=re.S)
        print("#"*40)
        print(text)
        return text #m.group(1).strip() if m else text.strip()