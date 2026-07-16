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
  Pencil
} from "lucide-react";
import { Influencer } from "../types";
import { parseCSV } from "../utils/csvParser";

interface AdminPanelProps {
  onClose: () => void;
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
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("supernova_admin_auth") === "true";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Layout tabs
  const [activeTab, setActiveTab] = useState<"csv" | "manual" | "manage" | "accounts">("csv");

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
  const [formGroup, setFormGroup] = useState<"catalogo" | "concorrentes" | "casting">("catalogo");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formMediaValue, setFormMediaValue] = useState("");
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
  const [editGroup, setEditGroup] = useState<"catalogo" | "concorrentes" | "casting">("catalogo");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editMediaValue, setEditMediaValue] = useState("");
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
    { email: "max.rost@supernova.art.br", role: "Super Admin" }
  ]);
  const [accountStatus, setAccountStatus] = useState("");

  // -----------------------------------------------------
  // LOGIN SUBMISSION
  // -----------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        localStorage.setItem("supernova_admin_auth", "true");
        setIsAuthenticated(true);
      } else {
        setLoginError(result.error || "Falha na autenticação corporativa.");
      }
    } catch (err) {
      setLoginError("Erro de comunicação com o servidor de segurança.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("supernova_admin_auth");
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
  };

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
          setCsvFeedback(errRes.error || "Falha ao gravar registros em lote no Firestore.");
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
          foto_url: formPhotoUrl || undefined,
          grupo: formGroup,
          media_valor: formMediaValue || undefined
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
        setFormPhotoUrl("");
        setFormMediaValue("");
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
    setEditGroup(inf.grupo || "catalogo");
    setEditPhotoUrl(inf.foto_url || "");
    setEditMediaValue(inf.media_valor || "");
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
          foto_url: editPhotoUrl || "",
          grupo: editGroup,
          media_valor: editMediaValue || ""
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
  const handleCreateAccount = (e: React.FormEvent) => {
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

    // Add to simulated list
    setAdminAccounts([...adminAccounts, { email: newAdminEmail, role: newAdminRole }]);
    setAccountStatus(`Conta corporativa para ${newAdminEmail} criada com sucesso.`);
    setNewAdminEmail("");
    setNewAdminPassword("");
  };

  // -----------------------------------------------------
  // MANAGEMENT PAGINATION CALCULATIONS
  // -----------------------------------------------------
  const totalPages = Math.ceil(influencers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInfluencers = influencers.slice(startIndex, startIndex + itemsPerPage);

  // -----------------------------------------------------
  // RENDERING AUTHENTICATION VIEW
  // -----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-[#141414]/80 backdrop-blur-xs">
        <div className="w-full max-w-md bg-[#E4E3E0] border border-[#141414] shadow-2xl p-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-6 justify-center">
            <Shield className="w-6 h-6 text-[#141414]" />
            <h2 className="text-xl font-bold font-serif text-[#141414]">Acesso Administrativo Restrito</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-mono font-bold block mb-1">E-mail Corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="insira email aqui"
                className="w-full bg-white border border-[#141414] px-3 py-2 text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase font-mono font-bold block mb-1">Senha de Segurança</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#141414] px-3 py-2 text-sm focus:outline-none"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs flex gap-2 items-start font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#141414] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? "Validando Chave de Acesso..." : "Autenticar Credenciais"}
            </button>
          </form>

          <div className="mt-6 border-t border-[#141414]/10 pt-4 text-center text-[10px] font-mono text-gray-500">
            Acesso monitorado. Tentativas consecutivas inválidas resultam em bloqueio automático de IP.
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // MAIN ADMIN INTERFACE
  // -----------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-[#141414]/50 backdrop-blur-xs">
      <div className="w-full max-w-4xl h-[90vh] bg-[#E4E3E0] border border-[#141414] shadow-2xl flex flex-col justify-between">
        
        {/* Top Header */}
        <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-[#DCDAD7]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#141414]" />
            <div>
              <span className="text-[10px] uppercase font-mono font-bold opacity-60 block">SUPERNOVA ADMIN CONSOLE</span>
              <span className="text-sm font-bold text-[#141414]">Sessão Ativa: max.rost@supernova.art.br</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick APIFY Trigger */}
            <button
              onClick={onForceApifySync}
              disabled={isSyncing}
              className="px-3 py-1.5 border border-[#141414] bg-white hover:bg-[#141414] hover:text-white text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{isSyncing ? "Sincronizando..." : "Sincronizar Dados do Instagram"}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 border border-[#141414] text-red-600 hover:bg-[#ff3b30] hover:text-white transition-colors cursor-pointer"
              title="Desconectar Painel"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Close Admin Dashboard */}
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Buttons bar */}
        <div className="flex border-b border-[#141414] bg-[#DCDAD7]">
          <button
            onClick={() => setActiveTab("csv")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-r border-[#141414] ${
              activeTab === "csv" ? "bg-[#E4E3E0] border-b-2 border-b-[#141414]" : "hover:bg-[#E4E3E0]/60"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-r border-[#141414] ${
              activeTab === "manual" ? "bg-[#E4E3E0] border-b-2 border-b-[#141414]" : "hover:bg-[#E4E3E0]/60"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Cadastro Manual</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("manage")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-r border-[#141414] ${
              activeTab === "manage" ? "bg-[#E4E3E0] border-b-2 border-b-[#141414]" : "hover:bg-[#E4E3E0]/60"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4" />
              <span>Gerenciamento</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "accounts" ? "bg-[#E4E3E0] border-b-2 border-b-[#141414]" : "hover:bg-[#E4E3E0]/60"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Admin</span>
            </div>
          </button>
        </div>

        {/* Dynamic Inner Panel Viewport */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: CSV FILE UPLOAD */}
          {activeTab === "csv" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#141414]">Importador de Banco de Dados CSV</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Arraste ou selecione um arquivo de lote CSV contendo o portfólio. Chaveamento rígido validará cabeçalhos e as faixas de reclassificação automática serão recalculadas imediatamente.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xs p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive ? "border-[#ff3b30] bg-[#ff3b30]/5" : "border-[#141414]/30 hover:border-[#141414] bg-white/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-xs font-bold uppercase text-[#141414] tracking-wider text-center">
                  Arraste seu arquivo .csv aqui ou clique para buscar localmente
                </p>
                <p className="text-[10px] text-gray-500 font-mono mt-2 uppercase text-center">
                  Campos Obrigatórios: nome, link_perfil, seguidores, categoria_sobre, classificacao
                </p>
              </div>

              {/* Progress and status reporting */}
              {csvStatus !== 'idle' && (
                <div className="bg-white border border-[#141414] p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold uppercase">
                      {csvStatus === 'parsing' && "Validando Cabeçalhos e Tipos..."}
                      {csvStatus === 'saving' && "Salvando no Banco de Dados Cloud..."}
                      {csvStatus === 'success' && "Lote processado!"}
                      {csvStatus === 'error' && "Falha Crítica Detectada"}
                    </span>
                    <span className="text-xs font-mono font-bold">{csvProgress}%</span>
                  </div>

                  {/* Progress Bar container */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden border border-[#141414]/10">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        csvStatus === 'error' ? "bg-red-500" : csvStatus === 'success' ? "bg-green-500" : "bg-[#141414]"
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
                <h3 className="text-lg font-bold font-serif text-[#141414]">Ficha de Cadastro de Influenciador</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Insira os dados cadastrais. O sistema efetuará classificação automática de acordo com as faixas de negócio após inserção.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex: Maximiliano Rost"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Link do Perfil</label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://instagram.com/user ou https://tiktok.com/@user"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Rede Social Principal</label>
                  <select
                    value={formSocial}
                    onChange={(e) => setFormSocial(e.target.value)}
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="twitch">Twitch</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Ramo / Nicho de Atuação</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-bold"
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
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Grupo</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as any)}
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-bold"
                  >
                    <option value="catalogo">Influenciadores</option>
                    <option value="concorrentes">Influenciadores de Concorrentes</option>
                    <option value="casting">Casting</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Média de Seguidores</label>
                  <input
                    type="number"
                    value={formFollowers}
                    onChange={(e) => setFormFollowers(e.target.value)}
                    placeholder="ex: 150000"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Taxa de Engajamento (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formEngagement}
                    onChange={(e) => setFormEngagement(e.target.value)}
                    placeholder="ex: 4.5"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Preço Estimado (R$)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="ex: 1200"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Nota de Valor / Média Valor</label>
                  <input
                    type="text"
                    value={formMediaValue}
                    onChange={(e) => setFormMediaValue(e.target.value)}
                    placeholder="ex: R$1.200 / Reels + Stories"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">URL da Foto de Perfil (Avatar)</label>
                  <input
                    type="text"
                    value={formPhotoUrl}
                    onChange={(e) => setFormPhotoUrl(e.target.value)}
                    placeholder="https://exemplo.com/sua_foto.jpg (Deixe vazio para usar foto automática)"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Público-Alvo Prioritário</label>
                  <input
                    type="text"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value)}
                    placeholder="ex: Millennials / Tech Enthusiasts"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 pt-2">
                  {formStatus === 'success' && (
                    <div className="mb-3 bg-green-100 border border-green-400 text-green-700 px-3 py-2 text-xs flex gap-1 items-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ficha cadastrada com sucesso no banco de dados!</span>
                    </div>
                  )}

                  {formStatus === 'error' && (
                    <div className="mb-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs flex gap-1 items-center font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === 'saving'}
                    className="w-full py-3 bg-[#141414] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50"
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
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#141414]/15">
                    <div>
                      <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-[#141414]">Editar Influenciador</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Modificando o perfil de <span className="font-bold text-[#141414]">{editingInfluencer.nome}</span></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingInfluencer(null)}
                      className="px-3 py-1.5 border border-[#141414] bg-white hover:bg-[#F2F1EE] text-[#141414] font-mono text-[9px] uppercase font-bold transition-all cursor-pointer"
                    >
                      Voltar ao Diretório
                    </button>
                  </div>

                  <form onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Link do Perfil</label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Rede Social Principal</label>
                      <select
                        value={editSocial}
                        onChange={(e) => setEditSocial(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitch">Twitch</option>
                        <option value="facebook">Facebook</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Ramo / Nicho de Atuação</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-bold"
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
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Grupo</label>
                      <select
                        value={editGroup}
                        onChange={(e) => setEditGroup(e.target.value as any)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none h-[34px] cursor-pointer font-bold"
                      >
                        <option value="catalogo">Influenciadores</option>
                        <option value="concorrentes">Influenciadores de Concorrentes</option>
                        <option value="casting">Casting</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Média de Seguidores</label>
                      <input
                        type="number"
                        value={editFollowers}
                        onChange={(e) => setEditFollowers(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Taxa de Engajamento (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editEngagement}
                        onChange={(e) => setEditEngagement(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Preço Estimado (R$)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Nota de Valor / Média Valor</label>
                      <input
                        type="text"
                        value={editMediaValue}
                        onChange={(e) => setEditMediaValue(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">URL da Foto de Perfil (Avatar)</label>
                      <input
                        type="text"
                        value={editPhotoUrl}
                        onChange={(e) => setEditPhotoUrl(e.target.value)}
                        placeholder="https://exemplo.com/sua_foto.jpg (Deixe vazio para usar foto automática)"
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none font-semibold text-blue-800"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-mono font-bold block mb-1">Público-Alvo Prioritário</label>
                      <input
                        type="text"
                        value={editAudience}
                        onChange={(e) => setEditAudience(e.target.value)}
                        className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 pt-2">
                      {editStatus === 'success' && (
                        <div className="mb-3 bg-green-100 border border-green-400 text-green-700 px-3 py-2 text-xs flex gap-1 items-center font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Alterações salvas com sucesso no banco de dados!</span>
                        </div>
                      )}

                      {editStatus === 'error' && (
                        <div className="mb-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs flex gap-1 items-center font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{editError}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingInfluencer(null)}
                          className="flex-1 py-3 bg-gray-200 text-[#141414] text-xs font-bold uppercase tracking-wider hover:bg-gray-300 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={editStatus === 'saving'}
                          className="flex-1 py-3 bg-[#141414] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50"
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
                    <h3 className="text-lg font-bold font-serif text-[#141414]">Diretório Geral de Influenciadores</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Exibição de todos os registros da base com suporte para edição detalhada e exclusão individual irrevogável.
                    </p>
                  </div>

                  {/* Sincronização Card */}
                  <div className="p-4 bg-white border border-[#141414] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#141414]">Sincronização de Seguidores (API)</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Atualize os números de seguidores de todos os influenciadores cadastrados buscando dados em tempo real da API Apify.
                      </p>
                    </div>
                    <button
                      onClick={onForceApifySync}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-[#141414] text-white hover:bg-[#333] text-xs font-bold uppercase tracking-wider transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{isSyncing ? "Sincronizando..." : "Sincronizar Seguidores"}</span>
                    </button>
                  </div>

                  {influencers.length === 0 ? (
                    <div className="text-center py-10 bg-white border border-[#141414] text-xs font-bold uppercase opacity-40">
                      Nenhum influenciador cadastrado no momento.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white border border-[#141414] overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#DCDAD7] border-b border-[#141414] font-mono text-[10px] uppercase font-bold text-[#141414]">
                              <th className="p-3">Nome</th>
                              <th className="p-3">Ramo</th>
                              <th className="p-3">Classificação</th>
                              <th className="p-3">Seguidores</th>
                              <th className="p-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedInfluencers.map((inf) => (
                              <tr key={inf.id} className="border-b border-[#141414]/10 hover:bg-[#F0F0F0]/50 transition-colors">
                                <td className="p-3 font-bold text-[#141414]">{inf.nome}</td>
                                <td className="p-3 font-semibold text-gray-600">{inf.categoria_sobre}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-[#141414] text-white text-[9px] font-bold uppercase">
                                    {inf.classificacao}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold text-gray-700">
                                  {inf.seguidores.toLocaleString("pt-BR")}
                                </td>
                                <td className="p-3 text-right flex justify-end gap-1.5">
                                  <button
                                    onClick={() => startEditing(inf)}
                                    className="p-1.5 border border-gray-300 hover:border-[#141414] hover:bg-gray-100 text-[#141414] transition-colors cursor-pointer"
                                    title="Editar Perfil"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setInfluencerToDelete(inf)}
                                    className="p-1.5 border border-red-200 hover:border-red-600 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
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
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span>Página {currentPage} de {totalPages}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 border border-[#141414] bg-white cursor-pointer hover:bg-[#F0F0F0] disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 border border-[#141414] bg-white cursor-pointer hover:bg-[#F0F0F0] disabled:opacity-30"
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
                <h3 className="text-lg font-bold font-serif text-[#141414]">Credenciais e Contas de Equipe</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Adicione novas contas administrativas para permitir acessos redundantes e gerenciamentos setoriais.
                </p>
              </div>

              <form onSubmit={handleCreateAccount} className="grid grid-cols-3 gap-4 bg-white border border-[#141414] p-5">
                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="email@supernova.art.br"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Senha Provisória</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="text-[10px] uppercase font-mono font-bold block mb-1">Perfil de Permissão</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Editor">Editor de Portfólio</option>
                    <option value="Analista">Analista de Métricas</option>
                    <option value="Admin">Administrador Geral</option>
                  </select>
                </div>

                <div className="col-span-3 pt-2">
                  {accountStatus && (
                    <p className="text-xs font-bold text-green-700 bg-green-50 p-2 border border-green-300 mb-2">
                      {accountStatus}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#141414] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors cursor-pointer"
                  >
                    Adicionar Colaborador
                  </button>
                </div>
              </form>

              {/* Accounts list */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider font-mono text-gray-500">Membros de Equipe</label>
                <div className="bg-white border border-[#141414] divide-y divide-[#141414]/10">
                  {adminAccounts.map((account, i) => (
                    <div key={i} className="p-3 flex justify-between items-center text-xs">
                      <span className="font-bold text-[#141414]">{account.email}</span>
                      <span className="px-2 py-0.5 bg-gray-100 border border-[#141414]/10 rounded-sm font-mono text-[9px] uppercase font-bold text-[#141414]">
                        {account.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* System Bar Footer */}
        <div className="p-4 border-t border-[#141414] bg-[#DCDAD7] text-center text-[10px] font-mono text-gray-500">
          Supernova Módulo de Alta Confiabilidade de Infraestrutura • © 2026.
        </div>
      </div>

      {/* Critical Deletion Confirmation Modal */}
      {influencerToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-sm bg-white border-2 border-[#141414] p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full border border-red-600 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold font-serif text-[#141414]">
              Confirmação Crítica Necessária
            </h4>

            <p className="text-xs text-gray-600">
              Tem certeza que deseja excluir <span className="font-bold">"{influencerToDelete.nome}"</span>? Esta ação removerá a ficha permanentemente e é <span className="text-red-600 font-bold uppercase">irreversível</span>.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setInfluencerToDelete(null)}
                className="flex-1 py-2 bg-gray-200 border border-[#141414] hover:bg-gray-300 transition-colors text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 border border-[#141414] hover:bg-red-700 transition-colors text-white text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
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
