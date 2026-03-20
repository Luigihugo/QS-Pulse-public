"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OrgRole } from "@/types/database";

export default function ProfileSettingsPage() {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);

  const [birthDate, setBirthDate] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const canManageInternal = role === "owner" || role === "admin" || role === "hr";

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, bio, headline")
        .eq("id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setBio(data.bio ?? "");
        setHeadline(data.headline ?? "");
      }

      // Descobre org e role para habilitar área interna.
      const { data: membership } = await supabase
        .from("org_members")
        .select("org_id, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (membership) {
        setOrgId(membership.org_id);
        setRole((membership.role as OrgRole) ?? null);

        // Tenta carregar dados internos (com fallback se migration ainda não aplicada).
        const privateRes = await supabase
          .from("profile_private_data")
          .select(
            "birth_date, hire_date, shoe_size, address_line, address_number, address_city, address_state, address_zip, emergency_contact_name, emergency_contact_phone, internal_notes"
          )
          .eq("org_id", membership.org_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!privateRes.error && privateRes.data) {
          setBirthDate(privateRes.data.birth_date ?? "");
          setHireDate(privateRes.data.hire_date ?? "");
          setShoeSize(privateRes.data.shoe_size ?? "");
          setAddressLine(privateRes.data.address_line ?? "");
          setAddressNumber(privateRes.data.address_number ?? "");
          setAddressCity(privateRes.data.address_city ?? "");
          setAddressState(privateRes.data.address_state ?? "");
          setAddressZip(privateRes.data.address_zip ?? "");
          setEmergencyContactName(privateRes.data.emergency_contact_name ?? "");
          setEmergencyContactPhone(privateRes.data.emergency_contact_phone ?? "");
          setInternalNotes(privateRes.data.internal_notes ?? "");
        }
      }
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão inválida.");
      setSaving(false);
      return;
    }
    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
        headline: headline.trim() || null,
      })
      .eq("id", user.id);
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    if (orgId) {
      const privatePayload = {
        org_id: orgId,
        user_id: user.id,
        birth_date: birthDate || null,
        hire_date: hireDate || null,
        shoe_size: shoeSize.trim() || null,
        address_line: addressLine.trim() || null,
        address_number: addressNumber.trim() || null,
        address_city: addressCity.trim() || null,
        address_state: addressState.trim() || null,
        address_zip: addressZip.trim() || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
        internal_notes: internalNotes.trim() || null,
      };

      const privateRes = await supabase
        .from("profile_private_data")
        .upsert(privatePayload, { onConflict: "org_id,user_id" });

      // Se a tabela ainda não existir, ignora para manter retrocompatibilidade.
      if (privateRes.error && !privateRes.error.message.includes("profile_private_data")) {
        setError(privateRes.error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.refresh();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-neutral-500">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Meu perfil</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Dados públicos são visíveis para colaboradores. Dados internos ficam restritos
        para owner/admin/RH e para você.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
            Nome completo
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="avatarUrl" className="block text-sm font-medium text-neutral-700">
            URL da foto (avatar)
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="headline" className="block text-sm font-medium text-neutral-700">
            Cargo / título (público)
          </label>
          <input
            id="headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Ex.: Advogada, Analista de RH, Tech Lead"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-neutral-700">
            Bio (público)
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Fale um pouco sobre você..."
            rows={4}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
          <h2 className="text-sm font-semibold text-neutral-800">Cadastro interno (restrito)</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Essas informações são para gestão interna de pessoas.
          </p>
          {!canManageInternal && (
            <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
              Você pode manter seus dados atualizados. Visualização consolidada para a organização
              fica disponível a owner/admin/RH.
            </p>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="birthDate" className="block text-xs font-medium text-neutral-700">
                Data de nascimento
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="hireDate" className="block text-xs font-medium text-neutral-700">
                Data de entrada
              </label>
              <input
                id="hireDate"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="shoeSize" className="block text-xs font-medium text-neutral-700">
                Número de calçado
              </label>
              <input
                id="shoeSize"
                type="text"
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="addressZip" className="block text-xs font-medium text-neutral-700">
                CEP
              </label>
              <input
                id="addressZip"
                type="text"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine" className="block text-xs font-medium text-neutral-700">
                Endereço
              </label>
              <input
                id="addressLine"
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="addressNumber" className="block text-xs font-medium text-neutral-700">
                Número
              </label>
              <input
                id="addressNumber"
                type="text"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="addressCity" className="block text-xs font-medium text-neutral-700">
                Cidade
              </label>
              <input
                id="addressCity"
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="addressState" className="block text-xs font-medium text-neutral-700">
                Estado
              </label>
              <input
                id="addressState"
                type="text"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="emergencyContactName" className="block text-xs font-medium text-neutral-700">
                Contato de emergência
              </label>
              <input
                id="emergencyContactName"
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="emergencyContactPhone" className="block text-xs font-medium text-neutral-700">
                Telefone de emergência
              </label>
              <input
                id="emergencyContactPhone"
                type="text"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="internalNotes" className="block text-xs font-medium text-neutral-700">
                Observações internas
              </label>
              <textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Sair
          </button>
        </div>
      </form>
    </div>
  );
}
