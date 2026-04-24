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
  emitenteCpfCnpj?: string;
  emitenteNome?: string;
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

  const extrairDadosCheque = (texto: string): DadosExtraidos => {
    const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);

    // Número do cheque: 6 dígitos isolados (evita pegar CNPJ/CPF)
    const numeroMatch = texto.match(/(?:^|[\s\n])(\d{6})(?:[\s\n]|$)/m)
      ?? texto.match(/\bCheque\s*[Nn][oº°]?\s*(\d{6})/i)
      ?? texto.match(/\b(\d{6})\b/);

    // Valor: prioriza padrão com asterisco (ex: * 5.000,00 ou *5000,00)
    const valorMatch =
      texto.match(/\*+\s*([0-9]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/)?.[1] ??
      texto.match(/R\$\s*([0-9]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/i)?.[1] ??
      texto.match(/\b([0-9]{1,3}(?:\.\d{3})+,\d{2})\b/)?.[1] ??
      texto.match(/\b([0-9]+,\d{2})\b/)?.[1];

    // Normaliza valor: troca ponto de milhar, mantém vírgula decimal
    const valorNorm = valorMatch
      ? valorMatch.replace(/\./g, '').replace(',', '.').trim()
      : undefined;

    // Data: DD/MM/AAAA ou DD/MM/AA — qualquer separador
    const dataMatch = texto.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{2,4})/);
    const dataFmt = dataMatch
      ? `${dataMatch[1].padStart(2, '0')}/${dataMatch[2].padStart(2, '0')}/${dataMatch[3].length === 2 ? '20' + dataMatch[3] : dataMatch[3]}`
      : undefined;

    // CNPJ: 00.000.000/0001-00
    const cnpjMatch = texto.match(/\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}/);
    // CPF: 000.000.000-00
    const cpfMatch = texto.match(/\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2}/);
    const docMatch = cnpjMatch?.[0]?.replace(/\s/g, '') ?? cpfMatch?.[0]?.replace(/\s/g, '');

    // Nome do emitente: linha que contém LTDA, EIRELI, ME, S/A, S.A ou está acima do CNPJ
    let nomeEmitente: string | undefined;
    const regexEmpresa = /\b(LTDA|EIRELI|S\.?A\.?|ME|EPP|MICROEMPRESA|CIA|COMERCIO|CONSTRU|SERVI)\b/i;
    for (const linha of linhas) {
      if (regexEmpresa.test(linha) && linha.length > 5) {
        nomeEmitente = linha.replace(/[^A-Za-zÀ-ÿ0-9\s\.\/\-]/g, '').trim();
        break;
      }
    }
    // Fallback: linha imediatamente antes do CNPJ encontrado
    if (!nomeEmitente && cnpjMatch) {
      const idxLinha = linhas.findIndex(l => l.includes(cnpjMatch[0].slice(0, 8)));
      if (idxLinha > 0) nomeEmitente = linhas[idxLinha - 1];
    }

    // Banco: nome após "Banco" ou na linha do logo
    const bancoMatch = texto.match(/\b(Santander|Bradesco|Ita[uú]|Caixa|BB|Brasil|Sicredi|Sicoob|BRB|Nubank|Inter|C6)\b/i);

    return {
      numero: numeroMatch?.[1],
      valor: valorNorm,
      data: dataFmt,
      banco: bancoMatch?.[1],
      emitenteCpfCnpj: docMatch,
      emitenteNome: nomeEmitente,
      raw: texto.slice(0, 500),
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
            accept="image/*,.heic,.heif"
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
                  { label: 'Valor', value: resultado.valor ? `R$ ${Number(resultado.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined },
                  { label: 'Vencimento', value: resultado.data },
                  { label: 'Banco', value: resultado.banco },
                  { label: 'CPF/CNPJ', value: resultado.emitenteCpfCnpj },
                  { label: 'Emitente', value: resultado.emitenteNome },
                ].map(({ label, value }) => value ? (
                  <div key={label} className={`bg-gray-50 rounded-lg px-2.5 py-1.5 ${label === 'CPF/CNPJ' || label === 'Emitente' ? 'col-span-2' : ''}`}>
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
