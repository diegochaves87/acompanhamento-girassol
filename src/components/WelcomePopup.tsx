"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  saibaMaisHref?: string;
};

export default function WelcomePopup({ saibaMaisHref }: Props) {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("girassol_welcome_seen")) {
      setShow(true);
    }
  }, []);

  function close() {
    localStorage.setItem("girassol_welcome_seen", "1");
    setShow(false);
  }

  function handleSaibaMais() {
    close();
    if (saibaMaisHref) router.push(saibaMaisHref);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0c0 0-4 4-4 8s4 8 4 8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c0 0 4 4 4 8s-4 8-4 8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-snug">
              Por que foi criado o Acompanhamento Girassol?
            </h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Uma ideia nascida da vontade de aproximar terapeuta e família, tornando cada etapa do tratamento uma experiência compartilhada, com mais conexão, cuidado e presença.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={close}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleSaibaMais}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1a4a3a" }}
          >
            Saiba Mais
          </button>
        </div>
      </div>
    </div>
  );
}
