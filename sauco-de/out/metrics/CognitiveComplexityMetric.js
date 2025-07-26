"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitiveComplexityMetric = void 0;
exports.CognitiveComplexityMetric = {
    name: 'cognitiveComplexity',
    description: 'Mide la complejidad cognitiva del código con base en estructuras de control, operadores lógicos, saltos y lambdas anidadas.',
    hasAction: true,
    action: {
        method: 'highlightMaxDepth',
    },
    extract(document) {
        /**
         * Cálculo de Complejidad Cognitiva:
         * ----------------------------------
         * Esta métrica estima el esfuerzo mental requerido para entender el flujo del código.
         * Se basa en una aproximación al modelo de SonarSource con las siguientes reglas:
         *
         * 1. +1 por cada estructura de control:
         *    - if, else if, else, for, while, switch, case, catch, try, do, finally
         *
         * 2. +1 adicional por cada nivel de anidamiento de estructuras de control.
         *
         * 3. +1 por cada uso de operadores lógicos compuestos:
         *    - &&, ||
         *
         * 4. +1 por cada salto de flujo:
         *    - return, break, continue, throw
         *
         * 5. +2 por cada lambda (=>) detectada.
         *    - Si hay lambdas anidadas, se multiplica por el nivel de anidación.
         *
         * 6. Se ignoran líneas en comentarios o dentro de strings.
         *
         * El valor final es una estimación que refleja la dificultad de lectura y mantenimiento.
         */
        const text = document.getText();
        const lines = text.split('\n');
        let complexity = 0;
        let nestingLevel = 0;
        let maxLine = 0;
        let inBlockComment = false;
        const controlPatterns = [
            /\b(if|else if|else|for|while|switch|case|catch|try|finally)\b/,
            /\b(do)\s*{?/,
        ];
        const logicalOperatorPattern = /(&&|\|\|)/;
        const jumpPattern = /\b(return|break|continue|throw)\b/;
        const lambdaPatterns = [/=>/, /->/]; // C# and Java
        let lambdaNestingLevel = 0;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            // Saltar comentarios de bloque
            if (inBlockComment) {
                if (line.includes('*/'))
                    inBlockComment = false;
                continue;
            }
            if (line.startsWith('/*')) {
                inBlockComment = true;
                continue;
            }
            // Saltar comentarios de línea y líneas vacías
            if (line.startsWith('//') || line === '')
                continue;
            line = line.replace(/(['"`])(\\.|[^\\])*?\1/g, '');
            if (controlPatterns.some(p => p.test(line))) {
                complexity += 1 + nestingLevel;
                maxLine = i;
                nestingLevel++;
            }
            if (logicalOperatorPattern.test(line)) {
                complexity += 1;
            }
            if (jumpPattern.test(line)) {
                complexity += 1;
            }
            if (lambdaPatterns.some(p => p.test(line))) {
                lambdaNestingLevel++;
                complexity += 2 * lambdaNestingLevel;
                maxLine = i;
            }
            const closeBraces = (line.match(/}/g) || []).length;
            nestingLevel -= closeBraces;
            if (nestingLevel < 0)
                nestingLevel = 0;
            lambdaNestingLevel -= closeBraces;
            if (lambdaNestingLevel < 0)
                lambdaNestingLevel = 0;
        }
        return {
            label: 'Complejidad Cognitiva estimada',
            value: complexity,
            lineNumber: maxLine,
        };
    },
};
//# sourceMappingURL=CognitiveComplexityMetric.js.map