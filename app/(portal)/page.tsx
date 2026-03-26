"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { getFolderTree } from "@/lib/queries";
import type { FolderTreeNode, Flow } from "@/lib/types";
import FolderList from "@/components/portal/FolderList";
import { useEffect } from "react";


export default function PortalHomePage() {
  const [activePage, setActivePage] = useState("inicio");
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [activeFolder, setActiveFolder] = useState<FolderTreeNode | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFolderTree();
        setTree(data);
      } catch (err) {
        console.error("Error loading folder tree:", err);
      }
    }
    loadData();
  }, []);

  const showPage = (pageId: string) => {
    setActivePage(pageId);
    setActiveFolder(null); // Reset folder when going to static pages
    setOpenDropdown(null);
  };

  const showFolder = (node: FolderTreeNode) => {
    setActiveFolder(node);
    setActivePage("folder");
    setOpenDropdown(null);
  };
  const heroImages: Record<string, string> = {
    inicio: "/images/portal/hero-inicio.jpg",
    melhoria: "/images/portal/hero-melhoria.jpg",
    participar: "/images/portal/hero-participar.jpg",
    contatos: "/images/portal/hero-contatos.jpg",
    "cadeia-de-valor": "/images/portal/hero-cadeiadevalor.jpg",
    folder: "/images/portal/hero-inicio.jpg", // Default for folders
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] text-[#0d1f35]">
      {/* ══ TOPBAR ══ */}
      <nav className="sticky top-0 z-[100] bg-[#0d1f35] px-4 md:px-10 py-[10px] flex items-center justify-between border-b border-white/5 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-[12px] text-white text-[0.85rem] font-bold tracking-wider hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            showPage("inicio");
          }}
        >
          <Image
            src="/images/portal/logo-topbar.jpg"
            alt="Logo"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
          />
          Portal SISPOM
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          {/* PARENT FOLDERS FROM DB */}
          {tree.map((node) => (
            <div key={node.folder.id} className="relative group/nav">
              <button
                onMouseEnter={() => setOpenDropdown(node.folder.id)}
                onClick={() => showFolder(node)}
                className={`text-[0.82rem] font-bold px-[14px] py-[6px] rounded-md transition-all flex items-center gap-1 ${
                  activeFolder?.folder.id === node.folder.id || openDropdown === node.folder.id
                    ? "text-white bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {node.folder.name}
                {node.children.length > 0 && (
                  <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === node.folder.id ? "rotate-180" : ""}`} />
                )}
              </button>

              {/* Recursive Dropdown Menu */}
              {openDropdown === node.folder.id && node.children.length > 0 && (
                <div 
                  className="absolute top-full left-0 mt-1 min-w-[260px] bg-white rounded-xl shadow-[0_15px_50px_rgba(13,31,53,0.3)] border border-[#0d1f35]/10 py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-[120]"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <FolderDropdownMenu 
                    nodes={node.children} 
                    onSelectFolder={showFolder}
                    depth={0}
                  />
                </div>
              )}
            </div>
          ))}

          <Link
            href="/login"
            className="text-white/70 hover:text-white hover:bg-white/5 text-[0.82rem] font-medium px-[14px] py-[6px] rounded-md transition-all ml-4"
          >
            Acesso Restrito
          </Link>
        </div>
      </nav>

      {/* ══ HERO HEADER ══ */}
      <header 
        className="hero relative min-h-[220px] bg-[#0d1f35] overflow-hidden flex items-center justify-center transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${heroImages[activePage] || heroImages.inicio})`,
          backgroundSize: 'auto 170%',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
        }}
        key={activePage}
      >
        <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6"></div>
      </header>

      {/* ══ ACTION BAR ══ */}
      <div className="bg-white flex justify-center shadow-[0_4px_20px_rgba(13,31,53,0.12)]">
        <div className="flex w-full max-w-screen-xl mx-auto overflow-x-auto no-scrollbar">
          {[
            { id: "inicio", label: "ℹ️ Conheça" },
            { id: "cadeia-de-valor", label: "🔗 Cadeia de Valor" },
            { id: "melhoria", label: "⚙️ Melhoria" },
            { id: "participar", label: "🙋 Participar" },
            { id: "contatos", label: "✉️ Contatos" },
          ].map((item, idx) => (
            <button
              key={item.id}
              onClick={() => showPage(item.id)}
              className={`flex-1 min-w-[150px] py-[18px] px-6 text-[0.8rem] font-bold tracking-[0.09em] uppercase transition-all border-b-4 flex items-center justify-center gap-2 whitespace-nowrap ${
                activePage === item.id
                  ? "bg-[#0d1f35] text-white border-[#c8a84b]"
                  : "bg-transparent text-[#0d1f35] border-transparent hover:bg-[#0d1f35] hover:text-white hover:border-[#c8a84b]"
              } ${idx > 0 ? "border-l border-[#0d1f35]/10" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-[1240px] w-full mx-auto p-10 md:p-[56px_40px]">
        {/* ══════════════════════════════
             PÁGINA: INÍCIO
        ══════════════════════════════ */}
        {activePage === "inicio" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="section-title">Bem-vindo ao Portal SISPOM</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: "📋",
                  title: "O que é o SISPOM?",
                  desc: "O SISPOM é o Sistema de Processos Organizacionais e Melhoria do TJPB, desenvolvido para mapear, padronizar e aprimorar os processos de trabalho das unidades judiciárias e administrativas.",
                },
                {
                  icon: "📊",
                  title: "Cadeia de Valor",
                  desc: "Visualize a cadeia de valor do Poder Judiciário da Paraíba e entenda como cada processo contribui para a prestação jurisdicional eficiente e de qualidade à sociedade.",
                },
                {
                  icon: "⚖️",
                  title: "Fluxos Judiciais",
                  desc: "Consulte os fluxos judiciais padronizados e as boas práticas adotadas pelas unidades, garantindo uniformidade e previsibilidade na tramitação dos processos.",
                },
                {
                  icon: "🏆",
                  title: "Reconhecimento",
                  desc: "O SISPOM é premiado pelo CNJ Qualidade (Prata) e reconhecido pelo selo Linguagem Simples 2024, demonstrando o compromisso com a excelência e acessibilidade da informação.",
                },
                {
                  icon: "🔗",
                  title: "IntegraJus",
                  desc: "Integração com o sistema IntegraJus para compartilhamento de boas práticas e fluxos de trabalho entre os tribunais brasileiros, fortalecendo a cooperação interinstitucional.",
                },
                {
                  icon: "🎯",
                  title: "Melhoria Contínua",
                  desc: "Participação ativa das equipes em oficinas de mapeamento e redesenho de processos, promovendo cultura de melhoria contínua e eficiência organizacional.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-[10px] p-7 shadow-[0_2px_12px_rgba(13,31,53,0.07)] border-t-[4px] border-[#0d1f35] hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(13,31,53,0.13)] transition-all duration-300"
                >
                  <div className="w-11 h-11 bg-[#0d1f35]/5 rounded-[10px] flex items-center justify-center mb-4 text-[1.3rem]">
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-[1rem] text-[#0d1f35] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[0.88rem] text-[#5a7090] leading-[1.65]">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             PÁGINA: CADEIA DE VALOR
        ══════════════════════════════ */}
        {activePage === "cadeia-de-valor" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="section-title">Cadeia de Valor</h2>
            
            {/* Imagem principal da Cadeia de Valor */}
            <div className="bg-white p-4 rounded-xl shadow-lg mb-10 overflow-hidden border border-[#0d1f35]/5">
              <Image
                src="/images/portal/cadeiadevalor.jpg"
                alt="Diagrama da Cadeia de Valor TJPB"
                width={1200}
                height={600}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>

            <div className="prose prose-slate max-w-none">
              <div className="bg-white rounded-[10px] p-8 shadow-[0_2px_12px_rgba(13,31,53,0.07)] border-l-[4px] border-[#0d1f35] mb-10">
                <h3 className="text-[1.2rem] font-bold text-[#0d1f35] mb-4 uppercase tracking-tight">
                  Desenvolvimento da Cadeia de Valor
                </h3>
                <p className="text-[0.95rem] text-[#5a7090] leading-[1.7] mb-4">
                  A construção da cadeia de valor do Tribunal de Justiça da Paraíba foi uma das entregas centrais do projeto Instituir Modelo de Governança, que buscou aprimorar a gestão estratégica e fortalecer o alinhamento das atividades do Tribunal às suas finalidades institucionais.
                </p>
                <p className="text-[0.95rem] text-[#5a7090] leading-[1.7] mb-4">
                  Durante o desenvolvimento do projeto, foram realizadas várias reuniões, nas quais se discutiram as atividades essenciais desempenhadas pelas unidades administrativas e judiciais, os processos críticos para o funcionamento da instituição e os resultados esperados pela sociedade.
                </p>
                <p className="text-[0.95rem] text-[#5a7090] leading-[1.7]">
                  A cadeia de valor finalizada representa um marco na implementação do modelo de governança, servindo como referência para o planejamento estratégico, o monitoramento de resultados e a gestão de riscos. Ela será amplamente utilizada para orientar iniciativas de melhoria contínua e fortalecer o compromisso do Tribunal com a eficiência, a transparência e a entrega de valor à sociedade.
                </p>
              </div>

              <h3 className="section-title text-[1.4rem] mb-8">Eixos de Atuação e Conceitos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {[
                  {
                    title: "Processos Finalísticos",
                    desc: "São os processos diretamente relacionados à entrega do serviço jurisdicional à sociedade, abrangendo a prestação de decisões judiciais e a solução de conflitos. Esses processos incluem as atividades do primeiro e segundo graus de jurisdição, bem como aquelas relacionadas a programas e projetos de acesso à justiça. O objetivo principal é garantir que as demandas da sociedade sejam atendidas com celeridade, equidade e eficácia.",
                    color: "border-[#c8a84b]",
                    icon: "⚖️"
                  },
                  {
                    title: "Suporte Jurisdicional",
                    desc: "Envolve as atividades que apoiam diretamente os processos finalísticos, permitindo a eficiência na prestação jurisdicional. Exemplos incluem a gestão de precatórios, cálculos judiciais, administração de processos eletrônicos, secretaria de audiências e apoio à execução de decisões. Esse macroprocesso é essencial para assegurar a infraestrutura e o suporte técnico que viabilizam as operações do núcleo finalístico.",
                    color: "border-[#0d1f35]",
                    icon: "🛠️"
                  },
                  {
                    title: "Suporte Administrativo",
                    desc: "Representa os processos voltados ao funcionamento interno do Tribunal, garantindo os recursos necessários para a execução das atividades judiciais e administrativas. Inclui áreas como gestão de pessoas, tecnologia da informação, infraestrutura, financeiro, orçamento, compras e logística. Esse suporte é fundamental para criar um ambiente operacional eficiente e sustentável, alinhado às boas práticas de gestão pública.",
                    color: "border-[#5a7090]",
                    icon: "🏢"
                  },
                  {
                    title: "Governança",
                    desc: "Compreende os processos relacionados à definição, supervisão e controle das diretrizes estratégicas e operacionais do Tribunal. Inclui planejamento estratégico, gestão de riscos, auditoria, controle interno, transparência e prestação de contas. Esse macroprocesso assegura que o Tribunal opere de forma integrada e orientada para o cumprimento de sua missão, promovendo a accountability e a conformidade institucional.",
                    color: "border-[#0d1f35]",
                    icon: "🧭"
                  }
                ].map((eixo) => (
                  <div key={eixo.title} className={`bg-white rounded-[10px] p-7 shadow-[0_2px_12px_rgba(13,31,53,0.07)] border-t-[4px] ${eixo.color}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[1.3rem]">{eixo.icon}</span>
                      <h4 className="font-bold text-[1.05rem] text-[#0d1f35]">{eixo.title}</h4>
                    </div>
                    <p className="text-[0.88rem] text-[#5a7090] leading-[1.65]">
                      {eixo.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             PÁGINA: MELHORIA DE PROCESSOS
        ══════════════════════════════ */}
        {activePage === "melhoria" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="section-title">Melhoria de Processos</h2>
            <div className="flex flex-col mb-12">
              {[
                {
                  num: 1,
                  title: "Identificação e Seleção do Processo",
                  desc: "Levantamento dos processos de trabalho prioritários junto às unidades, com base em critérios de impacto, volume, criticidade e alinhamento estratégico com os objetivos do TJPB.",
                },
                {
                  num: 2,
                  title: "Mapeamento AS IS (Situação Atual)",
                  desc: "Documentação e representação gráfica do processo atual, envolvendo entrevistas com os executores, observação in loco e análise dos gargalos, retrabalhos e pontos de melhoria.",
                },
                {
                  num: 3,
                  title: "Análise e Redesenho TO BE (Situação Futura)",
                  desc: "Proposta de um novo fluxo otimizado, eliminando desperdícios, automatizando etapas e alinhando as atividades às melhores práticas e normativos vigentes.",
                },
                {
                  num: 4,
                  title: "Validação com as Equipes",
                  desc: "Apresentação e validação do novo fluxo com os servidores e gestores envolvidos, por meio de oficinas participativas e rodadas de revisão colaborativa.",
                },
                {
                  num: 5,
                  title: "Implantação e Monitoramento",
                  desc: "Implementação do processo redesenhado com acompanhamento por indicadores de desempenho, ciclos de melhoria contínua e suporte do Escritório de Processos Organizacionais.",
                },
              ].map((step, idx, arr) => (
                <div key={step.num} className="flex gap-6 pb-9 last:pb-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="step-num">{step.num}</div>
                    {idx < arr.length - 1 && (
                      <div className="step-connector"></div>
                    )}
                  </div>
                  <div className="bg-white rounded-[10px] p-5 md:p-[20px_24px] flex-1 shadow-[0_2px_10px_rgba(13,31,53,0.07)] border-l-[4px] border-[#c8a84b]">
                    <h3 className="font-bold text-[#0d1f35] mb-[6px] text-[0.97rem]">
                      {step.title}
                    </h3>
                    <p className="text-[0.87rem] text-[#5a7090] leading-[1.65]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[10px] p-7 shadow-[0_2px_12px_rgba(13,31,53,0.07)]">
                <h3 className="flex items-center gap-[10px] font-condensed text-[1.1rem] font-bold text-[#0d1f35] uppercase tracking-wider mb-4 before:content-[''] before:block before:w-[3px] before:h-[18px] before:bg-[#c8a84b] before:rounded-[2px]">
                  Ferramentas Utilizadas
                </h3>
                <ul className="space-y-2">
                  {[
                    "BPMN — Business Process Model and Notation",
                    "Análise de Valor Agregado (VA/NVA)",
                    "Matriz de Responsabilidades (RACI)",
                    "Indicadores de Processo (KPIs)",
                    "Metodologia Lean e Kaizen",
                    "Mapeamento de Fluxo de Valor (VSM)",
                  ].map((tool) => (
                    <li
                      key={tool}
                      className="text-[0.88rem] text-[#4a6080] flex items-start gap-2 leading-relaxed before:content-['▸'] before:text-[#c8a84b] before:shrink-0"
                    >
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-[10px] p-7 shadow-[0_2px_12px_rgba(13,31,53,0.07)]">
                <h3 className="flex items-center gap-[10px] font-condensed text-[1.1rem] font-bold text-[#0d1f35] uppercase tracking-wider mb-4 before:content-[''] before:block before:w-[3px] before:h-[18px] before:bg-[#c8a84b] before:rounded-[2px]">
                  Benefícios Esperados
                </h3>
                <ul className="space-y-2">
                  {[
                    "Redução do tempo de tramitação dos processos",
                    "Eliminação de retrabalho e redundâncias",
                    "Maior transparência e rastreabilidade",
                    "Padronização entre unidades judiciárias",
                    "Melhoria da qualidade dos serviços prestados",
                    "Engajamento e capacitação dos servidores",
                  ].map((benefit) => (
                    <li
                      key={benefit}
                      className="text-[0.88rem] text-[#4a6080] flex items-start gap-2 leading-relaxed before:content-['▸'] before:text-[#c8a84b] before:shrink-0"
                    >
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             PÁGINA: COMO PARTICIPAR
        ══════════════════════════════ */}
        {activePage === "participar" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="section-title">Como Participar?</h2>
            <div className="participate-hero p-10 md:p-[40px_48px] text-white">
              <h2 className="font-condensed text-[1.9rem] font-bold uppercase tracking-wider mb-[10px]">
                Faça Parte da Transformação
              </h2>
              <p className="text-white/70 text-[0.95rem] max-w-[560px] leading-[1.65]">
                A melhoria dos processos do TJPB é construída coletivamente.
                Servidores de todas as unidades podem — e devem — contribuir
                com seu conhecimento para tornar a Justiça da Paraíba mais
                eficiente e acessível.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                {
                  icon: "🖋️",
                  title: "Indique um Processo",
                  desc: "Identifique um processo na sua unidade que pode ser melhorado e indique ao EPO para análise e priorização.",
                },
                {
                  icon: "👥",
                  title: "Participe das Oficinas",
                  desc: "Integre grupos de trabalho e oficinas de mapeamento promovidas pelo Escritório de Processos Organizacionais.",
                },
                {
                  icon: "💡",
                  title: "Contribua com Ideias",
                  desc: "Compartilhe boas práticas, sugestões de melhoria e experiências bem-sucedidas da sua unidade.",
                },
                {
                  icon: "📚",
                  title: "Capacite-se",
                  desc: "Participe das trilhas de capacitação em gestão por processos, BPMN e metodologias de melhoria contínua.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-[12px] p-7 text-center shadow-[0_2px_14px_rgba(13,31,53,0.08)] hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(13,31,53,0.13)] transition-all duration-300 border-b-[3px] border-transparent hover:border-[#c8a84b]"
                >
                  <div className="text-[2rem] mb-[14px]">{card.icon}</div>
                  <h3 className="font-bold text-[0.95rem] text-[#0d1f35] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[0.84rem] text-[#5a7090] leading-[1.6]">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[10px] p-7 shadow-[0_2px_12px_rgba(13,31,53,0.07)] mb-8">
              <h3 className="flex items-center gap-[10px] font-condensed text-[1.1rem] font-bold text-[#0d1f35] uppercase tracking-wider mb-4 before:content-[''] before:block before:w-[3px] before:h-[18px] before:bg-[#c8a84b] before:rounded-[2px]">
                Critérios para Priorização
              </h3>
              <ul className="space-y-2">
                {[
                  "Processos com alto volume de demanda ou gargalos recorrentes",
                  "Alinhamento com as metas estratégicas do TJPB",
                  "Impacto direto na prestação de serviços ao cidadão",
                  "Potencial de ganho de eficiência e redução de custos",
                  "Disponibilidade e engajamento da equipe da unidade",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-[0.88rem] text-[#4a6080] flex items-start gap-2 leading-relaxed before:content-['▸'] before:text-[#c8a84b] before:shrink-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={() => showPage("contatos")}
                className="inline-flex items-center gap-2 bg-[#0d1f35] text-white px-7 py-[13px] rounded-md font-bold text-[0.85rem] tracking-wider uppercase border-2 border-[#0d1f35] hover:bg-[#163057] transition-all"
              >
                <Mail className="w-4 h-4" /> Fale com o EPO
              </button>
              <Link
                href="#"
                className="inline-flex items-center gap-2 bg-transparent text-[#0d1f35] px-7 py-[13px] rounded-md font-bold text-[0.85rem] tracking-wider uppercase border-2 border-[#0d1f35] hover:bg-[#0d1f35] hover:text-white transition-all"
              >
                📄 Baixar Formulário de Indicação
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             PÁGINA: CONTATOS
        ══════════════════════════════ */}
        {activePage === "contatos" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="section-title">Contatos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: "🏛️",
                    title: "Escritório de Processos Organizacionais",
                    content: (
                      <p>
                        Diretoria de Governança e Gestão Estratégica
                        <br />
                        Tribunal de Justiça da Paraíba
                      </p>
                    ),
                  },
                  {
                    icon: "📍",
                    title: "Localização",
                    content: (
                      <p>
                        Anexo Administrativo – Praça João Pessoa, s/n
                        <br />
                        Centro – João Pessoa/PB
                      </p>
                    ),
                  },
                  {
                    icon: "📧",
                    title: "E-mail",
                    content: (
                      <a
                        href="mailto:epo@tjpb.jus.br"
                        className="hover:text-[#0d1f35] transition-colors"
                      >
                        epo@tjpb.jus.br
                      </a>
                    ),
                  },
                  {
                    icon: "📞",
                    title: "Telefone",
                    content: <p>(83) 3216-1400 / 3216-1500</p>,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-white rounded-[10px] p-[22px_20px] shadow-[0_2px_12px_rgba(13,31,53,0.07)] flex gap-4"
                  >
                    <div className="w-11 h-11 bg-[#0d1f35] text-white rounded-[10px] flex items-center justify-center text-[1.2rem] shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-[0.9rem] text-[#0d1f35] mb-1">
                        {item.title}
                      </h4>
                      <div className="text-[0.87rem] text-[#5a7090] leading-relaxed">
                        {item.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[12px] p-9 md:p-[36px_32px] shadow-[0_2px_14px_rgba(13,31,53,0.08)]">
                <h3 className="font-condensed text-[1.2rem] font-extrabold text-[#0d1f35] uppercase tracking-wider mb-6">
                  Envie uma Mensagem
                </h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[0.8rem] font-bold text-[#0d1f35] uppercase tracking-wider">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Seu nome"
                        className="border-[1.5px] border-[#dce4ef] rounded-md p-[10px_14px] text-[0.9rem] bg-[#f9fafc] focus:border-[#0d1f35] focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-[0.8rem] font-bold text-[#0d1f35] uppercase tracking-wider">
                        E-mail Institucional
                      </label>
                      <input
                        type="email"
                        placeholder="nome@tjpb.jus.br"
                        className="border-[1.5px] border-[#dce4ef] rounded-md p-[10px_14px] text-[0.9rem] bg-[#f9fafc] focus:border-[#0d1f35] focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[0.8rem] font-bold text-[#0d1f35] uppercase tracking-wider">
                      Assunto
                    </label>
                    <select className="border-[1.5px] border-[#dce4ef] rounded-md p-[10px_14px] text-[0.9rem] bg-[#f9fafc] focus:border-[#0d1f35] focus:bg-white outline-none transition-all">
                      <option>Indicação de Processo</option>
                      <option>Dúvidas sobre Mapeamento</option>
                      <option>Sugestão de Melhoria</option>
                      <option>Capacitação e Treinamentos</option>
                      <option>Outros Assuntos</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[0.8rem] font-bold text-[#0d1f35] uppercase tracking-wider">
                      Mensagem
                    </label>
                    <textarea
                      placeholder="Como podemos ajudar?"
                      className="border-[1.5px] border-[#dce4ef] rounded-md p-[10px_14px] text-[0.9rem] bg-[#f9fafc] min-h-[110px] resize-vertical focus:border-[#0d1f35] focus:bg-white outline-none transition-all"
                    ></textarea>
                  </div>
                  <button
                    type="button"
                    className="w-full bg-[#0d1f35] text-white py-[14px] rounded-md font-bold text-[0.85rem] tracking-wider uppercase border-2 border-[#0d1f35] hover:bg-[#163057] transition-all mt-2"
                  >
                    Enviar Mensagem
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* ══════════════════════════════
             PÁGINA: LISTAGEM DE FLUXOS
        ══════════════════════════════ */}
        {activePage === "folder" && activeFolder && (
          <FolderList 
            node={activeFolder} 
          />
        )}
      </main>

      {/* ══ FOOTER ══ */}
      <footer className="relative min-h-[140px] bg-[#0d1f35] overflow-hidden flex items-center justify-center">
        {/* Background Image: Already contains Logo, "Poder Judiciário" and Seals */}
        <Image
          src="/images/portal/footer-banner.jpg"
          alt="Footer Banner"
          fill
          className="object-cover opacity-100"
          priority
        />

        {/* Supplemental Text Overlay */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-white text-center pointer-events-none">
          <span className="font-extrabold text-[0.75rem] md:text-[0.85rem] uppercase tracking-wider mb-1 drop-shadow-lg">
            DIRETORIA DE GOVERNANÇA E GESTÃO ESTRATÉGICA
          </span>
          <div className="flex flex-col items-center gap-0.5 text-[0.7rem] md:text-[0.8rem] drop-shadow-md">
            <span className="font-medium">Escritório de Processos Organizacionais</span>
            <span className="opacity-90 pointer-events-auto">
              Site do Tribunal:{" "}
              <a
                href="https://www.tjpb.jus.br"
                target="_blank"
                className="hover:text-[#c8a84b] underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                https://www.tjpb.jus.br
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE: DROPDOWN RECURSIVO DE PASTAS (VERTICAL/ANINHADO)
// ════════════════════════════════════════════════════════════════════════

interface FolderDropdownMenuProps {
  nodes: FolderTreeNode[];
  onSelectFolder: (node: FolderTreeNode) => void;
  depth?: number;
}

function FolderDropdownMenu({ nodes, onSelectFolder, depth = 0 }: FolderDropdownMenuProps) {
  // Padrão: expandir o primeiro nível para facilitar a descoberta
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return (
    <div className="flex flex-col">
      {nodes.map((node) => (
        <div key={node.folder.id} className="flex flex-col">
          <div 
            className="flex items-center group transition-colors hover:bg-[#f4f6f9]"
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            <button
              onClick={() => onSelectFolder(node)}
              className="flex-1 flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] text-[#5a7090] group-hover:text-[#0d1f35] transition-colors text-left"
            >
              <FolderOpen className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-[#c8a84b]`} />
              <span className="truncate font-medium">{node.folder.name}</span>
            </button>
            
            {node.children.length > 0 && (
              <button 
                onClick={(e) => toggleFolder(e, node.folder.id)}
                className="p-2 mr-2 hover:bg-[#0d1f35]/5 rounded-md transition-all group-hover:bg-[#0d1f35]/5"
                title={expandedFolders[node.folder.id] ? "Recolher" : "Expandir"}
              >
                <ChevronRight className={`w-3.5 h-3.5 text-[#5a7090] transition-transform duration-300 ${expandedFolders[node.folder.id] ? "rotate-90" : ""}`} />
              </button>
            )}
          </div>

          {/* Sub-nível vertical aninhado */}
          {expandedFolders[node.folder.id] && node.children.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-300 border-l border-[#0d1f35]/5 ml-6 mb-1">
              <FolderDropdownMenu 
                nodes={node.children} 
                onSelectFolder={onSelectFolder}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

}
