'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle, ScanLine } from 'lucide-react';

type DadosExtraidos = {
  numero?: string;
  valor?: string;
  data?: string;
  banco?: string;
  emitenteCpfCnpj?: string;
  emitenteNome?: string;
};

export default function OcrCheque({
  onExtrair,
}: {
  onExtrair: (dados: DadosExtraidos) => void;
}) {
  const [imagem, setImagem] = useState<string | null>(null);
  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('image/jpeg');
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<DadosExtraidos | null>(null);
  const [erro, setErro] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const comprimirImagem = (dataUrl: string): Promise<{ base64: string; mime: string }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        const [, base64] = compressed.split(',');
        resolve({ base64, mime: 'image/jpeg' });
      };
      img.src = dataUrl;
    });

  const handleArquivo = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErro('Selecione uma imagem (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagem(dataUrl);
      const { base64, mime } = await comprimirImagem(dataUrl);
      setImagemBase64(base64);
      setMediaType(mime);
    };
    reader.readAsDataURL(file);
    setResultado(null);
    setErro('');
  };

  const processarOCR = async () => {
    if (!imagemBase64) return;
    setProcessando(true);
    setErro('');

    try {
      const res = await fetch('/api/ocr-cheque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imagemBase64, mediaType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Erro ${res.status}`);
      }

      const dados = await res.json();
      setResultado({
        numero: dados.numero ?? undefined,
        valor: dados.valor ?? undefined,
        data: dados.vencimento ?? undefined,
        banco: dados.banco ?? undefined,
        emitenteCpfCnpj: dados.cnpjCpf ?? undefined,
        emitenteNome: dados.nomeEmitente ?? undefined,
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar a imagem.');
    } finally {
      setProcessando(false);
    }
  };

  const aplicar = () => {
    if (resultado) {
      onExtrair(resultado);
      setImagem(null);
      setImagemBase64(null);
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
            onClick={() => { setImagem(null); setImagemBase64(null); setResultado(null); setErro(''); }}
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
          <div className="relative">
            <img
              src={imagem}
              alt="Cheque"
              className="w-full max-h-48 object-contain rounded-xl border border-blue-200 bg-white"
            />
          </div>

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
                  Analisando com IA...
                </>
              ) : (
                <>
                  <ScanLine className="w-3.5 h-3.5" />
                  Extrair dados do cheque
                </>
              )}
            </button>
          )}

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
