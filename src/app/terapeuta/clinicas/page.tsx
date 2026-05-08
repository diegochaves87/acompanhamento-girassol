import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

type Clinica = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  contract_type: string | null;
};

const CONTRACT_LABEL: Record<string, string> = {
  autonomo_por_sessao: "Autônomo por sessão",
  pj: "PJ",
  clt: "CLT",
};

async function getClinicas(): Promise<Clinica[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("id, name, city, state, contract_type")
    .order("name");
  return data ?? [];
}

export default async function ClinicasPage() {
  const clinicas = await getClinicas();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <PageHeader
        title="Clínicas"
        backHref="/terapeuta"
        backLabel="Início"
        iconColor="#FF5C7A"
        maxWidth="max-w-4xl"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        actions={
          <Link
            href="/terapeuta/clinicas/nova"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1D3557" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            Nova clínica
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {clinicas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 mb-1">Nenhuma clínica cadastrada ainda</p>
            <p className="text-sm text-gray-400 mb-6">Cadastre os locais onde você atende.</p>
            <Link
              href="/terapeuta/clinicas/nova"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1a4a3a" }}
            >
              Cadastrar clínica
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {clinicas.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/terapeuta/clinicas/${c.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#e8f0ec", color: "#1a4a3a" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {[
                          c.city && c.state ? `${c.city} · ${c.state}` : c.city ?? c.state,
                          c.contract_type ? CONTRACT_LABEL[c.contract_type] : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
