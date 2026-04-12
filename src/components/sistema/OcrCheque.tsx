'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, ScanLine } from 'lucide-react';

type DadosExtraidos = {
  numero?: string;
  valor?: string;
  data?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  raw?: string;
};

export default function OcrCheque({
  onExtrair,
}: {
  onExtrair: (dados: DadosExtraidos) => void;
}) {
  const [imagem, setImagem] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<DadosExtraidos | null>(null);
  const [erro, setErro] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleArquivo = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErro('Selecione uma imagem (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagem(e.target?.result as string);
    reader.readAsDataURL(file);
    setResultado(null);
    setErro('');
  };

  const processarOCR = async () => {
    if (!imagem) return;
    setProcessando(true);
    setProgresso(0);
    setErro('');

    try {
      // Importação dinâmica para não aumentar o bundle principal
      const Tesseract = (await import('tesseract.js')).default;

      const { data } = await Tesseract.recognize(imagem, 'por+eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgresso(Math.round(m.progress * 100));
          }
        },
      });

      const texto = data.text;
      const extraido = extrairDadosCheque(texto);
      setResultado(extraido);
    } catch (e) {
      setErro('Erro ao processar a imagem. Tente uma foto mais nítida.');
    } finally {
      setProcessando(false);
    }
  };

  /**
   * Tenta extrair dados estruturados do texto bruto do cheque.
   * Padrões comuns em cheques brasileiros.
   */
  const extrairDadosCheque = (texto: string): DadosExtraidos => {
    // Número do cheque (6 dígitos)
    const numeroMatch = texto.match(/\b(\d{6})\b/);
    // Valor monetário
    const valorMatch = texto.match(/R\$[\s]*([0-9.,]+)/i) ??
      texto.match(/\b(\d{1,3}(?:\.\d{3})*(?:,\d{2}))\b/);
    // Data DD/MM/AAAA ou variações
    const dataMatch = texto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    // CMC7 / código de barras banco
    const bancoMatch = texto.match(/Banco\s+(\w+)/i) ??
      texto.match(/B\.?\s*(\d{3})/i);

    return {
      numero: numeroMatch?.[1],
      valor: valorMatch?.[1]?.replace(/[^\d,]/g, ''),
      data: dataMatch
        ? `${dataMatch[1].padStart(2, '0')}/${dataMatch[2].padStart(2, '0')}/${dataMatch[3].length === 2 ? '20' + dataMatch[3] : dataMatch[3]}`
        : undefined,
      banco: bancoMatch?.[1],
      raw: texto.slice(0, 300),
    };
  };

  const aplicar = () => {
    if (resultado) {
      onExtrair(resultado);
      setImagem(null);
      setResultado(null);
    }
  };

  return (
    <div className="border-2 border-dashed border-blue-200 rounded-2xl p-4 bg-blue-50/30">
      <div className="flex items-center gap-2 mb-3">
        <ScanLine className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">OCR — Ler dados do cheque por foto</span>
        {imagem && (
          <button
            onClick={() => { setImagem(null); setResultado(null); setErro(''); }}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!imagem ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Carregar foto
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleArquivo(e.target.files[0])}
          />
          <p className="text-xs text-gray-500 self-center">
            Tire uma foto do cheque ou carregue a imagem para extrair os dados automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative">
            <img
              src={imagem}
              alt="Cheque"
              className="w-full max-h-48 object-contain rounded-xl border border-blue-200 bg-white"
            />
          </div>

          {/* Botão processar */}
          {!resultado && (
            <button
              type="button"
              onClick={processarOCR}
              disabled={processando}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60 w-full justify-center"
            >
              {processando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Lendo... {progresso}%
                </>
              ) : (
                <>
                  <ScanLine className="w-3.5 h-3.5" />
                  Extrair dados do cheque
                </>
              )}
            </button>
          )}

          {/* Barra de progresso */}
          {processando && (
            <div className="w-full h-1.5 bg-blue-100 rounded-full">
              <div
                className="h-1.5 bg-blue-500 rounded-full transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div className="bg-white rounded-xl p-3 border border-green-200 space-y-2">
              <div className="flex items-center gap-2 text-green-700 text-xs font-semibold mb-2">
                <CheckCircle className="w-4 h-4" /> Dados extraídos
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Número', value: resultado.numero },
                  { label: 'Valor', value: resultado.valor ? `R$ ${resultado.valor}` : undefined },
                  { label: 'Data', value: resultado.data },
                  { label: 'Banco', value: resultado.banco },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-gray-500">{label}: </span>
                    <span className="font-semibold text-gray-800">{value}</span>
                  </div>
                ) : null)}
              </div>
              {resultado.raw && (
                <details className="text-xs">
                  <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Ver texto bruto</summary>
                  <pre className="mt-1 text-gray-500 text-xs bg-gray-50 rounded p-2 overflow-auto max-h-20">{resultado.raw}</pre>
                </details>
              )}
              <button
                type="button"
                onClick={aplicar}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors mt-1"
              >
                Usar estes dados no formulário
              </button>
            </div>
          )}

          {erro && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{erro}</p>
          )}
        </div>
      )}
    </div>
  );
}
