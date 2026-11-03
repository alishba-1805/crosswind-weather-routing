import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({ignores:['dist/**','playwright-report/**','test-results/**']},js.configs.recommended,...ts.configs.recommended,{files:['**/*.{ts,tsx,js}'],languageOptions:{globals:{document:'readonly',fetch:'readonly',RequestInit:'readonly',AbortController:'readonly',setTimeout:'readonly',clearTimeout:'readonly',ResizeObserver:'readonly',GeoJSON:'readonly',console:'readonly',process:'readonly'}}});
