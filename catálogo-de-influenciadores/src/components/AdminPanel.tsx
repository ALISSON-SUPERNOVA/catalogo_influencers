import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  UserPlus, 
  ShieldAlert, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Pencil,
  UserCircle,
  KeyRound,
  Camera
} from "lucide-react";
import { Influencer } from "../types";
import { parseCSV } from "../utils/csvParser";

interface AdminPanelProps {
  onClose: () => void;
  onLogout: () => void;
  influencers: Influencer[];
  onRefreshData: () => Promise<void>;
  onForceApifySync: () => Promise<void>;
  isSyncing: boolean;
  syncProgress: number;
  syncStep: string;
  syncError: string | null;
  syncElapsed: number;
  syncUpdatedCount: number;
  onResetSync: () => Promise<void>;
}

export default function AdminPanel({
  onClose,
  onLogout,
  influencers,
  onRefreshData,
  onForceApifySync,
  isSyncing,
  syncProgress,
  syncStep,
  syncError,
  syncElapsed,
  syncUpdatedCount,
  onResetSync
}: AdminPanelProps) {
  const [email] = useState(() => localStorage.getItem("supernova_admin_email") || "");

  // Layout tabs
  const [activeTab, setActiveTab] = useState<"csv" | "manual" | "manage" | "accounts" | "profile">("csv");

  // CSV State
  const [dragActive, setDragActive] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsing' | 'saving' | 'success' | 'error'>('idle');
  const [csvFeedback, setCsvFeedback] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Form State
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formAudience, setFormAudience] = useState("");
  const [formSocial, setFormSocial] = useState("instagram");
  const [formFollowers, setFormFollowers] = useState("");
  const [formEngagement, setFormEngagement] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formGroup, setFormGroup] = useState<"catalogo" | "casting">("catalogo");
  const [formIsCompetitor, setFormIsCompetitor] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState("");

  // Editing State
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAudience, setEditAudience] = useState("");
  const [editSocial, setEditSocial] = useState("instagram");
  const [editFollowers, setEditFollowers] = useState("");
  const [editEngagement, setEditEngagement] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editGroup, setEditGroup] = useState<"catalogo" | "casting">("catalogo");
  const [editIsCompetitor, setEditIsCompetitor] = useState(false);
  const [editStatus, setEditStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [editError, setEditError] = useState("");

  // Pagination for Management Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Deletion Confirmation State
  const [influencerToDelete, setInfluencerToDelete] = useState<Influencer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Accounts State
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("Editor");
  const [adminAccounts, setAdminAccounts] = useState<{email: string, role: string}[]>([
    { email: "max.rost@supernova.art.br", role: "Admin" },
    { email: "alisson.silva@supernova.art.br", role: "Admin" }
  ]);
  const [accountStatus, setAccountStatus] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Meu Perfil State
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("supernova_admin_photo") || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState("");

  // -----------------------------------------------------
  // CSV FILE DRAG & DROP & PARSING
  // -----------------------------------------------------
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setCsvStatus('error');
      setCsvFeedback("Erro: O arquivo selecionado deve possuir a extensão .csv.");
      return;
    }

    setCsvStatus('parsing');
    setCsvProgress(10);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      
      // Call client-side custom CSV validator & parser
      const parsed = parseCSV(text, (percent) => {
        // Adjust client progress to 10% - 60% range during parsing
        setCsvProgress(10 + Math.round(percent * 0.5));
      });

      if (!parsed.success || !parsed.data) {
        setCsvStatus('error');
        setCsvFeedback(parsed.error || "Ocorreu um erro ao decodificar a estrutura do CSV.");
        return;
      }

      setCsvStatus('saving');
      setCsvProgress(70);

      try {
        // Send validated list to backend bulk insert endpoint
        const response = await fetch("/api/influencers/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ influencers: parsed.data })
        });

        if (response.ok) {
          const resData = await response.json();
          setCsvProgress(100);
          setCsvStatus('success');
          setCsvFeedback(`${resData.count} influenciadores processados com sucesso no banco de dados.`);
          await onRefreshData();
        } else {
          const errRes = await response.json();
          setCsvStatus('error');
          setCsvFeedback(errRes.error || "Falha ao gravar registros em lote no Supabase.");
        }
      } catch (err) {
        setCsvStatus('error');
        setCsvFeedback("Falha crítica de comunicação de lote.");
      }
    };

    reader.onerror = () => {
      setCsvStatus('error');
      setCsvFeedback("Erro de leitura de hardware do arquivo local.");
    };

    reader.readAsText(file);
  };

  // -----------------------------------------------------
  // MANUAL CADASTRO FORM
  // -----------------------------------------------------
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('idle');
    setFormError("");

    // Rigid client side validation
    if (!formName.trim()) return setError("Nome é obrigatório.");
    if (!formUrl.trim() || !formUrl.startsWith("http")) {
      return setError("Insira um Link de Perfil válido (iniciando com http/https).");
    }
    if (!formCategory.trim()) return setError("Ramo de Atuação é obrigatório.");

    setFormStatus('saving');

    try {
      const response = await fetch("/api/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formName,
          link_perfil: formUrl,
          seguidores: Number(formFollowers) || 0,
          categoria_sobre: formCategory,
          engajamento: Number(formEngagement) || 0.0,
          preco_estimado: Number(formPrice) || 0.0,
          publico_alvo: formAudience || "Geral",
          rede_social: formSocial,
          grupo: formIsCompetitor ? "concorrentes" : formGroup
        })
      });

      if (response.ok) {
        setFormStatus('success');
        // Reset Form
        setFormName("");
        setFormUrl("");
        setFormCategory("");
        setFormAudience("");
        setFormSocial("instagram");
        setFormFollowers("");
        setFormEngagement("");
        setFormPrice("");
        setFormGroup("catalogo");
        setFormIsCompetitor(false);
        await onRefreshData();
      } else {
        const err = await response.json();
        setFormStatus('error');
        setFormError(err.error || "Falha do servidor ao cadastrar influenciador.");
      }
    } catch (e) {
      setFormStatus('error');
      setFormError("Erro de comunicação ao salvar influenciador.");
    }
  };

  const setError = (msg: string) => {
    setFormStatus('error');
    setFormError(msg);
  };

  const startEditing = (inf: Influencer) => {
    setEditingInfluencer(inf);
    setEditName(inf.nome || "");
    setEditUrl(inf.link_perfil || "");
    setEditCategory(inf.categoria_sobre || "");
    setEditAudience(inf.publico_alvo || "");
    setEditSocial(inf.rede_social || "instagram");
    setEditFollowers(String(inf.seguidores || 0));
    setEditEngagement(String(inf.engajamento || 0));
    setEditPrice(String(inf.preco_estimado || 0));
    setEditGroup(inf.grupo === "casting" ? "casting" : "catalogo");
    setEditIsCompetitor(inf.grupo === "concorrentes");
    setEditStatus('idle');
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInfluencer) return;

    setEditStatus('idle');
    setEditError("");

    if (!editName.trim()) {
      setEditStatus('error');
      setEditError("Nome é obrigatório.");
      return;
    }
    if (!editUrl.trim() || !editUrl.startsWith("http")) {
      setEditStatus('error');
      setEditError("Insira um Link de Perfil válido (iniciando com http/https).");
      return;
    }
    if (!editCategory.trim()) {
      setEditStatus('error');
      setEditError("Ramo de Atuação é obrigatório.");
      return;
    }

    setEditStatus('saving');

    try {
      const response = await fetch(`/api/influencers/${editingInfluencer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: editName,
          link_perfil: editUrl,
          seguidores: Number(editFollowers) || 0,
          categoria_sobre: editCategory,
          engajamento: Number(editEngagement) || 0.0,
          preco_estimado: Number(editPrice) || 0.0,
          publico_alvo: editAudience || "Geral",
          rede_social: editSocial,
          grupo: editIsCompetitor ? "concorrentes" : editGroup
        })
      });

      if (response.ok) {
        setEditStatus('success');
        setEditingInfluencer(null);
        await onRefreshData();
      } else {
        const err = await response.json();
        setEditStatus('error');
        setEditError(err.error || "Falha ao atualizar influenciador.");
      }
    } catch (e) {
      setEditStatus('error');
      setEditError("Erro de comunicação ao atualizar influenciador.");
    }
  };

  // -----------------------------------------------------
  // DELETE OPERATIONS
  // -----------------------------------------------------
  const handleDeleteConfirm = async () => {
    if (!influencerToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/influencers/${influencerToDelete.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setInfluencerToDelete(null);
        await onRefreshData();
      }
    } catch (err) {
      alert("Falha ao excluir influenciador.");
    } finally {
      setIsDeleting(false);
    }
  };

  // -----------------------------------------------------
  // NEW ADMINISTRATIVE ACCOUNTS
  // -----------------------------------------------------
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountStatus("");

    if (!newAdminEmail.trim() || !newAdminEmail.includes("@")) {
      setAccountStatus("Insira um endereço de e-mail administrativo válido.");
      return;
    }
    if (newAdminPassword.length < 6) {
      setAccountStatus("A senha administrativa deve conter pelo menos 6 caracteres.");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const response = await fetch("/api/admin/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setAdminAccounts([...adminAccounts, { email: newAdminEmail, role: newAdminRole }]);
        setAccountStatus(`Conta para ${newAdminEmail} criada com sucesso no Supabase Auth.`);
        setNewAdminEmail("");
        setNewAdminPassword("");
      } else {
        setAccountStatus(result.error || "Falha ao criar a conta.");
      }
    } catch (err) {
      setAccountStatus("Erro de comunicação ao criar a conta.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // -----------------------------------------------------
  // MEU PERFIL: PHOTO UPLOAD & PASSWORD CHANGE
  // -----------------------------------------------------
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecione um arquivo de imagem válido.");
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageBase64 = event.target?.result as string;
      try {
        const response = await fetch("/api/admin/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, imageBase64 })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          localStorage.setItem("supernova_admin_photo", result.url);
          setAvatarUrl(result.url);
        } else {
          setAvatarError(result.error || "Falha ao enviar a foto.");
        }
      } catch (err) {
        setAvatarError("Erro de comunicação ao enviar a foto.");
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.onerror = () => {
      setIsUploadingAvatar(false);
      setAvatarError("Erro de leitura do arquivo local.");
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus('idle');
    setPasswordError("");

    if (!currentPassword) {
      setPasswordStatus('error');
      setPasswordError("Informe sua senha atual.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus('error');
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('error');
      setPasswordError("A confirmação não corresponde à nova senha.");
      return;
    }

    setPasswordStatus('saving');

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setPasswordStatus('success');
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordStatus('error');
        setPasswordError(result.error || "Falha ao atualizar a senha.");
      }
    } catch (err) {
      setPasswordStatus('error');
      setPasswordError("Erro de comunicação ao atualizar a senha.");
    }
  };

  // -----------------------------------------------------
  // MANAGEMENT PAGINATION CALCULATIONS
  // -----------------------------------------------------
  const totalPages = Math.ceil(influencers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInfluencers = influencers.slice(startIndex, startIndex + itemsPerPage);

  // -----------------------------------------------------
  // MAIN ADMIN INTERFACE (login now happens at the platform level, before this ever mounts)
  // -----------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-ink/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl h-[90vh] bg-canvas border border-line rounded-2xl shadow-soft flex flex-col justify-between overflow-hidden">

        {/* Top Header */}
        <div className="p-6 border-b border-line flex justify-between items-center bg-canvas-subtle">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent" />
            <div>
              <span className="text-[10px] uppercase font-sans font-semibold text-ink-soft block">SUPERNOVA ADMIN CONSOLE</span>
              <span className="text-sm font-semibold text-ink">Sessão Ativa: {email || "administrador"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick APIFY Trigger */}
            <button
              onClick={onForceApifySync}
              disabled={isSyncing}
              className="px-3 py-1.5 border border-line bg-canvas rounded-lg hover:bg-canvas-muted text-ink text-xs font-semibold uppercase transition-colors duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{isSyncing ? "Sincronizando..." : "Sincronizar Dados do Instagram"}</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => { onClose(); onLogout(); }}
              className="p-1.5 rounded-lg border border-line text-danger hover:bg-danger hover:text-white transition-colors duration-150 cursor-pointer"
              title="Sair da Plataforma"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Close Admin Dashboard */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-line flex items-center justify-center hover:bg-ink hover:text-white transition-colors duration-150 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Buttons bar */}
        <div className="flex border-b border-line bg-canvas-subtle overflow-x-auto">
          <button
            onClick={() => setActiveTab("csv")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-r border-line whitespace-nowrap ${
              activeTab === "csv" ? "bg-accent text-white" : "text-ink-soft hover:bg-canvas-muted"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-r border-line whitespace-nowrap ${
              activeTab === "manual" ? "bg-accent text-white" : "text-ink-soft hover:bg-canvas-muted"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Cadastro Manual</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("manage")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-r border-line whitespace-nowrap ${
              activeTab === "manage" ? "bg-accent text-white" : "text-ink-soft hover:bg-canvas-muted"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4" />
              <span>Gerenciamento</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer border-r border-line whitespace-nowrap ${
              activeTab === "accounts" ? "bg-accent text-white" : "text-ink-soft hover:bg-canvas-muted"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Admin</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === "profile" ? "bg-accent text-white" : "text-ink-soft hover:bg-canvas-muted"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCircle className="w-4 h-4" />
              <span>Meu Perfil</span>
            </div>
          </button>
        </div>

        {/* Dynamic Inner Panel Viewport */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: CSV FILE UPLOAD */}
          {activeTab === "csv" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold font-sans text-ink">Importador de Banco de Dados CSV</h3>
                <p className="text-xs text-ink-soft mt-1">
                  Arraste ou selecione um arquivo de lote CSV contendo o portfólio. As colunas correspondem exatamente aos campos de <code className="font-mono text-[11px]">catalogo.perfis</code>; classificação, foto e demais campos automáticos são preenchidos pelo sistema depois.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive ? "border-accent bg-accent/5" : "border-line hover:border-accent bg-canvas-subtle/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-ink-soft mb-3" />
                <p className="text-xs font-semibold uppercase text-ink tracking-wider text-center">
                  Arraste seu arquivo .csv aqui ou clique para buscar localmente
                </p>
                <p className="text-[10px] text-ink-soft font-sans mt-2 uppercase text-center">
                  Obrigatórios: nome_completo, link_perfil
                </p>
                <p className="text-[10px] text-ink-soft font-sans mt-1 uppercase text-center">
                  Aceitos: rede_social, ramo_nicho, grupo, seguidores, taxa_engajamento, preco_estimado, publico_alvo, tag_concorrente
                </p>
              </div>

              {/* Progress and status reporting */}
              {csvStatus !== 'idle' && (
                <div className="bg-canvas-subtle border border-line rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-sans font-semibold uppercase">
                      {csvStatus === 'parsing' && "Validando Cabeçalhos e Tipos..."}
                      {csvStatus === 'saving' && "Salvando no Banco de Dados Cloud..."}
                      {csvStatus === 'success' && "Lote processado!"}
                      {csvStatus === 'error' && "Falha Crítica Detectada"}
                    </span>
                    <span className="text-xs font-sans font-semibold">{csvProgress}%</span>
                  </div>

                  {/* Progress Bar container */}
                  <div className="w-full h-2 bg-canvas-muted rounded-full overflow-hidden border border-line">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        csvStatus === 'error' ? "bg-red-500" : csvStatus === 'success' ? "bg-green-500" : "bg-ink"
                      }`}
                      style={{ width: `${csvProgress}%` }}
                    />
                  </div>

                  {/* Message report Card */}
                  <div className={`p-3 text-xs font-medium border ${
                    csvStatus === 'error' ? "bg-red-50 border-red-300 text-red-700" : "bg-green-50 border-green-300 text-green-700"
                  }`}>
                    <div className="flex gap-2 items-start">
                      {csvStatus === 'error' ? (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <span>{csvFeedback || "Processando operação..."}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FORMULARIO MANUAL DE CADASTRO */}
          {activeTab === "manual" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold font-sans text-ink">Ficha de Cadastro de Influenciador</h3>
                <p className="text-xs text-ink-soft mt-1">
                  Insira os dados cadastrais. O sistema efetuará classificação automática de acordo com as faixas de negócio após inserção.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex: Maximiliano Rost"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Link do Perfil</label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://instagram.com/user ou https://tiktok.com/@user"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Rede Social</label>
                  <select
                    value={formSocial}
                    onChange={(e) => setFormSocial(e.target.value)}
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Ramo / Nicho de Atuação</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-semibold"
                    required
                  >
                    <option value="">Selecione o Ramo...</option>
                    <option value="Humor">Humor</option>
                    <option value="Gastronomia">Gastronomia</option>
                    <option value="Moda">Moda</option>
                    <option value="Maquiagem">Maquiagem</option>
                    <option value="Decoração">Decoração</option>
                    <option value="Entrevistador">Entrevistador</option>
                    <option value="Viagem">Viagem</option>
                    <option value="Academia">Academia</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Grupo</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as any)}
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-semibold"
                  >
                    <option value="catalogo">Influenciador</option>
                    <option value="casting">Modelo</option>
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsCompetitor}
                      onChange={(e) => setFormIsCompetitor(e.target.checked)}
                      className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
                    />
                    <span>É perfil de concorrente</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Seguidores</label>
                  <input
                    type="number"
                    value={formFollowers}
                    onChange={(e) => setFormFollowers(e.target.value)}
                    placeholder="ex: 150000"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Taxa de Engajamento (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formEngagement}
                    onChange={(e) => setFormEngagement(e.target.value)}
                    placeholder="ex: 4.5"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Preço Estimado (R$)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="ex: 1200"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Público-Alvo Prioritário</label>
                  <input
                    type="text"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value)}
                    placeholder="ex: Millennials / Tech Enthusiasts"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 pt-2">
                  {formStatus === 'success' && (
                    <div className="mb-3 bg-green-100 border border-green-400 text-green-700 px-3 py-2 text-xs flex gap-1 items-center font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ficha cadastrada com sucesso no banco de dados!</span>
                    </div>
                  )}

                  {formStatus === 'error' && (
                    <div className="mb-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs flex gap-1 items-center font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === 'saving'}
                    className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-ink transition-colors duration-150 cursor-pointer disabled:opacity-50"
                  >
                    {formStatus === 'saving' ? "Cadastrando Ficha..." : "Cadastrar Influenciador"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: GERENCIAMENTO E EXCLUSÃO CONTRALIZADA */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              {editingInfluencer ? (
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-line/15">
                    <div>
                      <h3 className="text-sm font-semibold uppercase font-sans tracking-wider text-ink">Editar Influenciador</h3>
                      <p className="text-[11px] text-ink-soft mt-0.5">Modificando o perfil de <span className="font-semibold text-ink">{editingInfluencer.nome}</span></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingInfluencer(null)}
                      className="px-3 py-1.5 border border-line bg-canvas-subtle rounded-lg hover:bg-canvas-subtle text-ink font-sans text-[9px] uppercase font-semibold transition-all cursor-pointer"
                    >
                      Voltar ao Diretório
                    </button>
                  </div>

                  <form onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Link do Perfil</label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Rede Social</label>
                      <select
                        value={editSocial}
                        onChange={(e) => setEditSocial(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Ramo / Nicho de Atuação</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-semibold"
                        required
                      >
                        <option value="">Selecione o Ramo...</option>
                        <option value="Humor">Humor</option>
                        <option value="Gastronomia">Gastronomia</option>
                        <option value="Moda">Moda</option>
                        <option value="Maquiagem">Maquiagem</option>
                        <option value="Decoração">Decoração</option>
                        <option value="Entrevistador">Entrevistador</option>
                        <option value="Viagem">Viagem</option>
                        <option value="Academia">Academia</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Grupo</label>
                      <select
                        value={editGroup}
                        onChange={(e) => setEditGroup(e.target.value as any)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-semibold"
                      >
                        <option value="catalogo">Influenciador</option>
                        <option value="casting">Modelo</option>
                      </select>
                    </div>

                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsCompetitor}
                          onChange={(e) => setEditIsCompetitor(e.target.checked)}
                          className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
                        />
                        <span>É perfil de concorrente</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Seguidores</label>
                      <input
                        type="number"
                        value={editFollowers}
                        onChange={(e) => setEditFollowers(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Taxa de Engajamento (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editEngagement}
                        onChange={(e) => setEditEngagement(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Preço Estimado (R$)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Público-Alvo Prioritário</label>
                      <input
                        type="text"
                        value={editAudience}
                        onChange={(e) => setEditAudience(e.target.value)}
                        className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 pt-2">
                      {editStatus === 'success' && (
                        <div className="mb-3 bg-green-100 border border-green-400 text-green-700 px-3 py-2 text-xs flex gap-1 items-center font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Alterações salvas com sucesso no banco de dados!</span>
                        </div>
                      )}

                      {editStatus === 'error' && (
                        <div className="mb-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs flex gap-1 items-center font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{editError}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingInfluencer(null)}
                          className="flex-1 py-3 rounded-lg bg-canvas-muted text-ink text-xs font-semibold uppercase tracking-wider hover:bg-line transition-colors duration-150 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={editStatus === 'saving'}
                          className="flex-1 py-3 rounded-lg bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-ink transition-colors duration-150 cursor-pointer disabled:opacity-50"
                        >
                          {editStatus === 'saving' ? "Salvando Alterações..." : "Salvar Alterações"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold font-sans text-ink">Diretório Geral de Influenciadores</h3>
                    <p className="text-xs text-ink-soft mt-1">
                      Exibição de todos os registros da base com suporte para edição detalhada e exclusão individual irrevogável.
                    </p>
                  </div>

                  {/* Sincronização Card */}
                  <div className="p-4 bg-canvas-subtle border border-line rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase font-sans tracking-wider text-ink">Sincronização de Seguidores (API)</h4>
                      <p className="text-[11px] text-ink-soft mt-1">
                        Atualize os números de seguidores de todos os influenciadores cadastrados buscando dados em tempo real da API Apify.
                      </p>
                    </div>
                    <button
                      onClick={onForceApifySync}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-ink text-white hover:bg-accent-ink text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{isSyncing ? "Sincronizando..." : "Sincronizar Seguidores"}</span>
                    </button>
                  </div>

                  {influencers.length === 0 ? (
                    <div className="text-center py-10 bg-canvas-subtle border border-line rounded-lg text-xs font-semibold uppercase opacity-40">
                      Nenhum influenciador cadastrado no momento.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-canvas-subtle border border-line rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-canvas-subtle border-b border-line font-sans text-[10px] uppercase font-semibold text-ink">
                              <th className="p-3">Nome</th>
                              <th className="p-3">Ramo</th>
                              <th className="p-3">Classificação</th>
                              <th className="p-3">Seguidores</th>
                              <th className="p-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedInfluencers.map((inf) => (
                              <tr key={inf.id} className="border-b border-line hover:bg-canvas-muted/50 transition-colors">
                                <td className="p-3 font-semibold text-ink">{inf.nome}</td>
                                <td className="p-3 font-semibold text-ink-soft">{inf.categoria_sobre}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-ink text-white text-[9px] font-semibold uppercase">
                                    {inf.classificacao}
                                  </span>
                                </td>
                                <td className="p-3 font-sans font-semibold text-ink">
                                  {inf.seguidores.toLocaleString("pt-BR")}
                                </td>
                                <td className="p-3 text-right flex justify-end gap-1.5">
                                  <button
                                    onClick={() => startEditing(inf)}
                                    className="p-1.5 border border-line hover:border-ink hover:bg-canvas-muted text-ink transition-colors duration-150 rounded-lg cursor-pointer"
                                    title="Editar Perfil"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setInfluencerToDelete(inf)}
                                    className="p-1.5 border border-red-200 hover:border-danger hover:bg-red-50 text-danger transition-colors duration-150 rounded-lg cursor-pointer"
                                    title="Excluir Definitivamente"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                  {/* Pagination bar */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center text-xs font-sans font-semibold">
                      <span>Página {currentPage} de {totalPages}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 border border-line bg-canvas-subtle rounded-lg cursor-pointer hover:bg-canvas-muted disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 border border-line bg-canvas-subtle rounded-lg cursor-pointer hover:bg-canvas-muted disabled:opacity-30"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>)}
            </div>
          )}

          {/* TAB 4: NOVAS CONTAS ADMINISTRATIVAS */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold font-sans text-ink">Credenciais e Contas de Equipe</h3>
                <p className="text-xs text-ink-soft mt-1">
                  Adicione novas contas administrativas para permitir acessos redundantes e gerenciamentos setoriais.
                </p>
              </div>

              <form onSubmit={handleCreateAccount} className="grid grid-cols-3 gap-4 bg-canvas-subtle border border-line rounded-lg p-5">
                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="email@supernova.art.br"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Senha Provisória</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Perfil de Permissão</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Editor">Editor de Portfólio</option>
                    <option value="Analista">Analista de Métricas</option>
                    <option value="Admin">Administrador Geral</option>
                  </select>
                </div>

                <div className="col-span-3 pt-2">
                  {accountStatus && (
                    <p className="text-xs font-semibold text-green-700 bg-green-50 p-2 border border-green-300 mb-2">
                      {accountStatus}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isCreatingAccount}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-ink transition-colors duration-150 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingAccount ? "Criando..." : "Adicionar Colaborador"}
                  </button>
                </div>
              </form>

              {/* Accounts list */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider font-sans text-ink-soft">Membros de Equipe</label>
                <p className="text-[10px] text-ink-soft">Lista local desta sessão — contas são reais no Supabase Auth.</p>
                <div className="bg-canvas border border-line rounded-lg divide-y divide-line">
                  {adminAccounts.map((account, i) => (
                    <div key={i} className="p-3 flex justify-between items-center text-xs">
                      <span className="font-semibold text-ink">{account.email}</span>
                      <span className="px-2 py-0.5 bg-canvas-muted border border-line rounded-lg font-sans text-[9px] uppercase font-semibold text-ink">
                        {account.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MEU PERFIL */}
          {activeTab === "profile" && (
            <div className="space-y-8 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold font-sans text-ink">Meu Perfil</h3>
                <p className="text-xs text-ink-soft mt-1">
                  Gerencie sua foto e sua senha de acesso ao painel administrativo.
                </p>
              </div>

              {/* Photo */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-accent/10 border border-line overflow-hidden flex items-center justify-center shrink-0 text-xl font-semibold text-accent relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-10 h-10 text-accent" />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="px-3 py-2 rounded-lg border border-line bg-canvas-subtle hover:bg-canvas-muted text-ink text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isUploadingAvatar ? "Enviando..." : "Trocar foto"}</span>
                  </button>
                  {avatarError && <p className="text-xs text-danger">{avatarError}</p>}
                </div>
              </div>

              {/* Password */}
              <form onSubmit={handleChangePassword} className="space-y-4 border-t border-line pt-6">
                <h4 className="text-xs font-semibold uppercase font-sans tracking-wider text-ink flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-accent" />
                  Trocar Senha
                </h4>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Senha Atual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans font-semibold block mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                {passwordStatus === 'success' && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 text-xs flex gap-2 items-center font-semibold rounded-lg">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Senha atualizada com sucesso.</span>
                  </div>
                )}
                {passwordStatus === 'error' && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs flex gap-2 items-center font-semibold rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordStatus === 'saving'}
                  className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-ink transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  {passwordStatus === 'saving' ? "Atualizando..." : "Atualizar Senha"}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* System Bar Footer */}
        <div className="p-4 border-t border-line bg-canvas-subtle text-center text-[10px] font-sans text-ink-soft">
          Supernova Módulo de Alta Confiabilidade de Infraestrutura • © 2026.
        </div>
      </div>

      {/* Critical Deletion Confirmation Modal */}
      {influencerToDelete && (
        <div className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-sm bg-canvas border border-line rounded-2xl shadow-soft p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full border border-red-600 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="text-base font-semibold font-sans text-ink">
              Confirmação Crítica Necessária
            </h4>

            <p className="text-xs text-ink-soft">
              Tem certeza que deseja excluir <span className="font-semibold">"{influencerToDelete.nome}"</span>? Esta ação removerá a ficha permanentemente e é <span className="text-red-600 font-semibold uppercase">irreversível</span>.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setInfluencerToDelete(null)}
                className="flex-1 py-2 bg-canvas-muted border border-line hover:bg-line transition-colors duration-150 rounded-lg text-xs font-semibold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg bg-danger hover:bg-red-700 transition-colors duration-150 text-white text-xs font-semibold uppercase cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Excluir Registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
