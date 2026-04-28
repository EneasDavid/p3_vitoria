const API_BASE = '/api';
const TOKEN_KEY = 'storyflow_token';
const PAGE = window.STORYFLOW_PAGE || 'inicio';
const READER_FONTS = new Set(['serif_classic', 'georgia', 'book', 'sans_clean']);
const READER_BACKGROUNDS = new Set(['paper_yellow', 'cream', 'off_white', 'sepia_dark']);

const state = {
    page: PAGE,
    token: null,
    user: null,
    painel: null,
    biblioteca: null,
    minhasHistorias: [],
    catalogo: [],
    catalogoFiltros: {generos_disponiveis: []},
    historiaDetalhe: null,
    autoriaSelecionadaId: null,
    capituloEditandoId: null,
    capituloAtivo: null,
    readerPagination: {
        pages: [],
        currentPage: 0,
        wordsPerPage: 200,
        currentGlobalPage: 1,
    },
    readerSession: {
        id: null,
        startedAt: null,
        pageStartedAt: null,
        intervalId: null,
        autoSaveIntervalId: null,
        unsentSeconds: 0,
    },
    readerPrefs: {
        fontFamily: 'serif_classic',
        fontSize: 24,
        bgColor: 'paper_yellow',
    },
    filtros: {
        q: '',
        genero: '',
        ordem: 'destaques',
    },
    debounce: null,
};

const el = {};

document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    carregarPreferenciasLeitor();
    sincronizarControlesLeitor();
    bindGlobalEvents();
    if (!(await garantirSessao())) {
        return;
    }

    aplicarFiltrosDaURL();
    sincronizarInputsBusca();
    await carregarTela();
});

function cacheElements() {
    el.toast = document.getElementById('toast');
    el.logout = document.getElementById('logout-button');
    el.headerUserName = document.getElementById('header-user-name');
    el.globalSearch = document.getElementById('global-search');
    el.sidebarAvatar = document.getElementById('sidebar-avatar');
    el.sidebarAvatarLetter = document.getElementById('sidebar-avatar-letter');

    el.inicioDestaque = document.getElementById('inicio-destaque');
    el.inicioRecomendacoes = document.getElementById('inicio-recomendacoes');
    el.inicioContinuar = document.getElementById('inicio-continuar');
    el.inicioCategorias = document.getElementById('inicio-categorias');
    el.inicioEmAlta = document.getElementById('inicio-em-alta');

    el.historiasBusca = document.getElementById('historias-busca');
    el.historiasGenero = document.getElementById('historias-genero');
    el.historiasOrdem = document.getElementById('historias-ordem');
    el.historiasGrid = document.getElementById('historias-grid');
    el.historiaDetalhe = document.getElementById('historia-detalhe');

    el.sumTotal = document.getElementById('sum-total');
    el.sumLendo = document.getElementById('sum-lendo');
    el.sumFavoritos = document.getElementById('sum-favoritos');
    el.sumConcluidos = document.getElementById('sum-concluidos');
    el.bibliotecaCategorias = document.getElementById('biblioteca-categorias');
    el.bibliotecaProgresso = document.getElementById('biblioteca-progresso');

    el.formNovaHistoria = document.getElementById('nova-historia-form');
    el.formNovoCapitulo = document.getElementById('novo-capitulo-form');
    el.writerEditorModal = document.getElementById('writer-editor-modal');
    el.writerEditorBackdrop = document.getElementById('writer-editor-backdrop');
    el.writerEditorClose = document.getElementById('writer-editor-close');
    el.writerEditorTitle = document.getElementById('writer-editor-title');
    el.writerEditorMode = document.getElementById('writer-editor-mode');
    el.historiaEditId = document.getElementById('historia-edit-id');
    el.historiaSubmit = document.getElementById('historia-submit');
    el.writerModalChaptersList = document.getElementById('writer-modal-chapters-list');
    el.storyCoverInput = document.getElementById('story-cover-input');
    el.storyFileInput = document.getElementById('story-file-input');
    el.storyPreviewInput = document.getElementById('story-preview-input');
    el.capituloHistoriaId = document.getElementById('capitulo-historia-id');
    el.capituloEditId = document.getElementById('capitulo-edit-id');
    el.capituloFormTitle = document.getElementById('capitulo-form-title');
    el.capituloFormHint = document.getElementById('capitulo-form-hint');
    el.capituloSubmit = document.getElementById('capitulo-submit');
    el.capituloEditCancel = document.getElementById('capitulo-edit-cancel');
    el.autoriaHistorias = document.getElementById('autoria-historias');
    el.writerAddTopButton = document.querySelector('.writer-add-book-card');

    el.perfilNome = document.getElementById('perfil-nome');
    el.perfilEmail = document.getElementById('perfil-email');
    el.profileAvatar = document.getElementById('profile-avatar');
    el.profilePhotoForm = document.getElementById('profile-photo-form');
    el.profilePhotoInput = document.getElementById('profile-photo-input');
    el.profilePhotoRemove = document.getElementById('profile-photo-remove');
    el.voceStats = document.getElementById('voce-stats');
    el.voceProgresso = document.getElementById('voce-progresso');
    el.voceAutoria = document.getElementById('voce-autoria');

    el.readerModal = document.getElementById('reader-modal');
    el.readerCard = document.querySelector('.reader-card');
    el.readerBackdrop = document.getElementById('reader-modal-backdrop');
    el.readerClose = document.getElementById('reader-close');
    el.readerStoryName = document.getElementById('reader-story-name');
    el.readerChapterTitle = document.getElementById('reader-chapter-title');
    el.readerMeta = document.getElementById('reader-meta');
    el.readerContent = document.getElementById('reader-content');
    el.readerChapterSelect = document.getElementById('reader-chapter-select');
    el.readerTocList = document.getElementById('reader-toc-list');
    el.readerSidePanel = document.getElementById('reader-side-panel');
    el.readerPanelClose = document.getElementById('reader-panel-close');
    el.readerShowToc = document.getElementById('reader-show-toc');
    el.readerShowSettings = document.getElementById('reader-show-settings');
    el.readerProgressRange = document.getElementById('reader-progress-range');
    el.readerSampleBanner = document.getElementById('reader-sample-banner');
    el.readerSampleClose = document.getElementById('reader-sample-close');
    el.readerPredictedValue = document.getElementById('reader-predicted-value');
    el.readerBookTitleTop = document.getElementById('reader-book-title-top');
    el.readerPagePrev = document.getElementById('reader-page-prev');
    el.readerPageNext = document.getElementById('reader-page-next');
    el.readerPageCounter = document.getElementById('reader-page-counter');
    el.readerSessionTime = document.getElementById('reader-session-time');
    el.readerPageTime = document.getElementById('reader-page-time');
    el.readerChapterTime = document.getElementById('reader-chapter-time');
    el.readerBookTime = document.getElementById('reader-book-time');
    el.readerHighlight = document.getElementById('reader-highlight');
    el.readerMark = document.getElementById('reader-mark');
    el.readerFinish = document.getElementById('reader-finish');
    el.readerFontOptions = document.getElementById('reader-font-options');
    el.readerFontSize = document.getElementById('reader-font-size');
    el.readerFontSizeValue = document.getElementById('reader-font-size-value');
    el.readerBgOptions = document.getElementById('reader-bg-options');
    el.readerCommentsCount = document.getElementById('reader-comments-count');
    el.readerComments = document.getElementById('reader-comments');
    el.readerCommentForm = document.getElementById('reader-comment-form');
    el.readerCommentInput = document.getElementById('reader-comment-input');
    el.readerMarksCount = document.getElementById('reader-marks-count');
    el.readerMarksList = document.getElementById('reader-marks-list');
    el.readerSessionsCount = document.getElementById('reader-sessions-count');
    el.readerSessionsList = document.getElementById('reader-sessions-list');
}

function bindGlobalEvents() {
    el.logout?.addEventListener('click', encerrarSessao);

    // Clique no avatar abre seletor de arquivo para foto de perfil
    el.profileAvatar?.addEventListener('click', () => {
        if (el.profilePhotoInput) {
            el.profilePhotoInput.click();
        }
    });

    // Envio automático ao selecionar arquivo
    el.profilePhotoInput?.addEventListener('change', () => {
        if (el.profilePhotoForm) {
            el.profilePhotoForm.dispatchEvent(new Event('submit', {cancelable: true}));
        }
    });

    // Topbar: abrir editor de escrita com estilo de `btn-primary`
    el.writerAddTopButton?.addEventListener('click', (e) => {
        e.preventDefault();
        abrirEditorAutoria();
    });

    el.globalSearch?.addEventListener('input', (event) => {
        state.filtros.q = event.target.value.trim();
        sincronizarInputsBusca();

        if (!['inicio', 'historias'].includes(state.page)) {
            return;
        }
        clearTimeout(state.debounce);
        state.debounce = setTimeout(() => {
            carregarCatalogo().then(() => {
                if (state.page === 'inicio') {
                    renderInicio();
                } else {
                    renderHistorias();
                }
            }).catch(handleError);
        }, 280);
    });

    el.historiasBusca?.addEventListener('input', (event) => {
        state.filtros.q = event.target.value.trim();
        if (el.globalSearch) {
            el.globalSearch.value = state.filtros.q;
        }
        clearTimeout(state.debounce);
        state.debounce = setTimeout(async () => {
            try {
                await carregarCatalogo();
                renderHistorias();
            } catch (error) {
                handleError(error);
            }
        }, 280);
    });

    el.historiasGenero?.addEventListener('change', async (event) => {
        state.filtros.genero = event.target.value;
        await recarregarHistoriasComTratamento();
    });

    el.historiasOrdem?.addEventListener('change', async (event) => {
        state.filtros.ordem = event.target.value;
        await recarregarHistoriasComTratamento();
    });

    el.inicioDestaque?.addEventListener('click', handleStoryActionClick);
    el.inicioRecomendacoes?.addEventListener('click', handleStoryActionClick);
    el.inicioContinuar?.addEventListener('click', handleStoryActionClick);
    el.inicioCategorias?.addEventListener('click', handleStoryActionClick);
    el.inicioEmAlta?.addEventListener('click', handleStoryActionClick);
    el.historiasGrid?.addEventListener('click', handleStoryActionClick);
    el.historiaDetalhe?.addEventListener('click', handleStoryActionClick);
    el.historiaDetalhe?.addEventListener('mouseover', handleRatingHover);
    el.historiaDetalhe?.addEventListener('mouseout', handleRatingHoverOut);
    el.bibliotecaCategorias?.addEventListener('click', handleStoryActionClick);
    el.bibliotecaProgresso?.addEventListener('click', handleStoryActionClick);
    el.voceProgresso?.addEventListener('click', handleStoryActionClick);
    el.voceAutoria?.addEventListener('click', handleStoryActionClick);
    el.autoriaHistorias?.addEventListener('click', handleStoryActionClick);

    el.formNovaHistoria?.addEventListener('submit', publicarHistoria);
    el.formNovoCapitulo?.addEventListener('submit', publicarCapitulo);
    el.writerEditorBackdrop?.addEventListener('click', fecharEditorAutoria);
    el.writerEditorClose?.addEventListener('click', fecharEditorAutoria);
    el.capituloEditCancel?.addEventListener('click', () => {
        limparEdicaoCapitulo(true);
    });
    el.capituloHistoriaId?.addEventListener('change', (event) => {
        abrirEditorAutoria(event.target.value);
        renderEscrever();
    });
    el.profilePhotoForm?.addEventListener('submit', enviarFotoPerfil);
    el.profilePhotoRemove?.addEventListener('click', removerFotoPerfil);

    el.readerBackdrop?.addEventListener('click', fecharLeitor);
    el.readerClose?.addEventListener('click', fecharLeitor);
    el.readerPagePrev?.addEventListener('click', navegarPaginaAnterior);
    el.readerPageNext?.addEventListener('click', navegarProximaPagina);
    el.readerShowToc?.addEventListener('click', () => alternarPainelLeitor('toc'));
    el.readerShowSettings?.addEventListener('click', () => alternarPainelLeitor('settings'));
    el.readerPanelClose?.addEventListener('click', () => {
        el.readerSidePanel?.classList.toggle('is-collapsed');
        if (el.readerSidePanel?.classList.contains('is-collapsed')) {
            el.readerShowToc?.classList.remove('is-active');
            el.readerShowSettings?.classList.remove('is-active');
        }
    });
    el.readerSampleClose?.addEventListener('click', () => {
        el.readerSampleBanner?.classList.add('hidden');
    });
    el.readerTocList?.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-reader-chapter-id]');
        const storyId = state.capituloAtivo?.historia?.id;
        const chapterId = button?.dataset.readerChapterId;
        if (storyId && chapterId && chapterId !== state.capituloAtivo?.capitulo?.id) {
            await abrirCapitulo(storyId, chapterId);
        }
    });
    el.readerProgressRange?.addEventListener('change', async (event) => {
        await registrarTempoLeituraAtual();
        const alvo = Number(event.target.value || 1) - 1;
        state.readerPagination.currentPage = Math.max(0, Math.min((state.readerPagination.pages.length || 1) - 1, alvo));
        renderPaginaAtualLeitura();
    });
    el.readerChapterSelect?.addEventListener('change', async (event) => {
        const chapterId = event.target.value;
        const storyId = state.capituloAtivo?.historia?.id;
        if (storyId && chapterId && chapterId !== state.capituloAtivo?.capitulo?.id) {
            await abrirCapitulo(storyId, chapterId);
        }
    });
    el.readerFontSize?.addEventListener('input', onReaderPreferenceChanged);
    el.readerFontOptions?.addEventListener('click', handleReaderPreferenceOptionClick);
    el.readerBgOptions?.addEventListener('click', handleReaderPreferenceOptionClick);
    el.readerHighlight?.addEventListener('click', destacarSelecaoAtual);
    el.readerMarksList?.addEventListener('click', handleReaderMarksClick);
    el.readerCommentForm?.addEventListener('submit', comentarCapituloAtual);
    el.readerComments?.addEventListener('click', handleCommentActionClick);
}

async function garantirSessao() {
    state.token = localStorage.getItem(TOKEN_KEY);
    if (!state.token) {
        redirecionarLogin();
        return false;
    }

    try {
        const response = await api('/auth/me');
        state.user = response.usuario;
        atualizarIdentidadeUI();
        return true;
    } catch (error) {
        redirecionarLogin();
        return false;
    }
}

function aplicarFiltrosDaURL() {
    const params = new URLSearchParams(window.location.search);
    state.filtros.q = params.get('q') || state.filtros.q;
    state.filtros.genero = params.get('genero') || state.filtros.genero;
    state.filtros.ordem = params.get('ordem') || state.filtros.ordem;
}

function sincronizarInputsBusca() {
    if (el.globalSearch) {
        el.globalSearch.value = state.filtros.q;
    }
    if (el.historiasBusca) {
        el.historiasBusca.value = state.filtros.q;
    }
}

async function carregarTela() {
    switch (state.page) {
        case 'inicio':
            await Promise.all([carregarPainel(), carregarCatalogo()]);
            renderInicio();
            break;
        case 'historias':
            await carregarCatalogo();
            renderHistorias();
            await selecionarHistoriaInicial();
            break;
        case 'biblioteca':
            await Promise.all([carregarBiblioteca(), carregarPainel()]);
            renderBiblioteca();
            break;
        case 'escrever':
            await carregarAutoria();
            renderEscrever();
            break;
        case 'voce':
            await carregarPainel();
            renderVoce();
            break;
        default:
            await carregarPainel();
            break;
    }
}

async function carregarPainel() {
    const response = await api('/me/painel');
    state.painel = response;
    state.minhasHistorias = response.autoria?.historias || [];
    state.biblioteca = response.leitura?.biblioteca || null;
    if (response.conta) {
        state.user = {...(state.user || {}), ...response.conta};
        atualizarIdentidadeUI();
    }
}

async function carregarCatalogo() {
    const response = await api('/me/catalogo', {
        query: {
            q: state.filtros.q,
            genero: state.filtros.genero,
            ordem: state.filtros.ordem,
        },
    });
    state.catalogo = response.historias || [];
    state.catalogoFiltros = response.filtros || {generos_disponiveis: []};
}

async function carregarBiblioteca() {
    const response = await api('/me/biblioteca');
    state.biblioteca = response.biblioteca || {};
}

async function carregarAutoria() {
    const response = await api('/me/autoria/historias');
    state.minhasHistorias = response.historias || [];
}

function renderInicio() {
    renderInicioDestaque();
    renderInicioRecomendacoes();
    renderInicioContinuar();
    renderInicioCategorias();
    renderInicioEmAlta();
}

function renderInicioDestaque() {
    if (!el.inicioDestaque) {
        return;
    }
    const destaque = state.catalogo[0];
    if (!destaque) {
        el.inicioDestaque.innerHTML = `<p class="placeholder">Nenhuma história encontrada no momento.</p>`;
        return;
    }

    const chapterId = destaque.progresso_leitor?.capitulo_id || destaque.capitulo_inicial_id;
    el.inicioDestaque.innerHTML = `
        <p class="chip">Em alta</p>
        <h2>${escapeHtml(destaque.titulo)}</h2>
        <p class="muted">${escapeHtml(destaque.sinopse)}</p>
        <p class="meta-line">${escapeHtml(destaque.autor || 'Autor desconhecido')} · ${escapeHtml(destaque.genero || 'Leitura')}</p>
        <div class="inline-actions">
            <button class="btn-ghost" data-action="abrir-historia" data-story-id="${destaque.id}" type="button">Ver detalhes</button>
            <button class="btn-primary" data-action="abrir-capitulo" data-story-id="${destaque.id}" data-chapter-id="${chapterId || ''}" type="button">
                ${destaque.progresso_leitor ? 'Continuar' : 'Ler agora'}
            </button>
            <button class="btn-ghost" data-action="salvar-historia" data-story-id="${destaque.id}" data-categoria="lendo" type="button">Salvar</button>
        </div>
    `;
}

function renderInicioRecomendacoes() {
    if (!el.inicioRecomendacoes) {
        return;
    }
    const recomendadas = state.painel?.leitura?.recomendacoes || [];
    if (!recomendadas.length) {
        el.inicioRecomendacoes.innerHTML = `
            <h3>Recomendados para você</h3>
            <p class="placeholder">Sem recomendações por enquanto. Continue lendo para personalizar.</p>
        `;
        return;
    }

    el.inicioRecomendacoes.innerHTML = `
        <h3>Recomendados para você</h3>
        <div class="stack-list">
            ${recomendadas.slice(0, 3).map((story) => `
                <article class="compact-story">
                    <div>
                        <strong>${escapeHtml(story.titulo)}</strong>
                        <p class="muted">${escapeHtml(story.autor || 'Autor')} · ${escapeHtml(story.genero || 'Leitura')}</p>
                    </div>
                    <button class="btn-ghost" data-action="abrir-historia" data-story-id="${story.id}" type="button">Abrir</button>
                </article>
            `).join('')}
        </div>
    `;
}

function renderInicioContinuar() {
    if (!el.inicioContinuar) {
        return;
    }
    const progresso = state.painel?.leitura?.progresso || [];
    if (!progresso.length) {
        el.inicioContinuar.innerHTML = `<p class="placeholder">Você ainda não iniciou nenhuma leitura.</p>`;
        return;
    }
    const item = progresso[0];
    const chapterId = item.capitulo_id || item.historia.capitulo_inicial_id;
    el.inicioContinuar.innerHTML = `
        <div class="player-row">
            <div>
                <strong>${escapeHtml(item.historia.titulo)}</strong>
                <p class="muted">${escapeHtml(item.capitulo_titulo || 'Capítulo inicial')}</p>
            </div>
            <button class="btn-primary" data-action="abrir-capitulo" data-story-id="${item.historia.id}" data-chapter-id="${chapterId || ''}" type="button">
                Continuar leitura
            </button>
        </div>
        <div class="progress">
            <span style="width:${item.percentual}%"></span>
        </div>
        <p class="muted">${item.percentual}% concluído</p>
    `;
}

function renderInicioCategorias() {
    if (!el.inicioCategorias) {
        return;
    }
    const generos = [...new Set((state.catalogo || []).map((story) => story.genero).filter(Boolean))];
    el.inicioCategorias.innerHTML = generos.length
        ? generos.map((genero) => `<button class="chip" data-action="filtrar-genero" data-genero="${escapeHtml(genero)}" type="button">${escapeHtml(genero)}</button>`).join('')
        : `<span class="placeholder">Sem gêneros disponíveis.</span>`;
}

function renderInicioEmAlta() {
    if (!el.inicioEmAlta) {
        return;
    }
    const stories = state.catalogo.slice(0, 4);
    if (!stories.length) {
        el.inicioEmAlta.innerHTML = `<p class="placeholder">Sem histórias em alta agora.</p>`;
        return;
    }
    el.inicioEmAlta.innerHTML = stories.map((story) => renderStoryCard(story)).join('');
}

function renderHistorias() {
    if (!el.historiasGrid) {
        return;
    }
    renderFiltrosHistorias();
    el.historiasGrid.innerHTML = state.catalogo.length
        ? state.catalogo.map((story) => renderStoryCard(story)).join('')
        : `<p class="placeholder">Nenhuma história encontrada com os filtros atuais.</p>`;
}

function renderFiltrosHistorias() {
    if (!el.historiasGenero || !el.historiasOrdem) {
        return;
    }
    const generos = state.catalogoFiltros.generos_disponiveis || [];
    el.historiasGenero.innerHTML = `
        <option value="">Todos os gêneros</option>
        ${generos.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')}
    `;
    el.historiasGenero.value = state.filtros.genero;
    el.historiasOrdem.value = state.filtros.ordem;
}

async function selecionarHistoriaInicial() {
    if (!el.historiaDetalhe) {
        return;
    }
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('story');
    const first = state.catalogo[0]?.id;
    const storyId = requested || first;
    if (!storyId) {
        el.historiaDetalhe.innerHTML = `<p class="placeholder">Selecione uma história para ver capítulos e ler.</p>`;
        return;
    }
    await selecionarHistoria(storyId);
}

async function selecionarHistoria(storyId) {
    const response = await api(`/me/historias/${encodeURIComponent(storyId)}`);
    state.historiaDetalhe = response.historia;
    atualizarQueryHistoria(storyId);
    renderDetalheHistoria();
}

function renderDetalheHistoria() {
    if (!el.historiaDetalhe) {
        return;
    }
    const story = state.historiaDetalhe;
    if (!story) {
        el.historiaDetalhe.innerHTML = `<p class="placeholder">Selecione uma história para visualizar detalhes.</p>`;
        return;
    }

    const progresso = story.progresso_leitor?.percentual;
    el.historiaDetalhe.innerHTML = `
        <p class="chip">${escapeHtml(story.genero || 'Leitura')}</p>
        <h3>${escapeHtml(story.titulo)}</h3>
        <p class="muted">por ${escapeHtml(story.autor || 'Autor desconhecido')}</p>
        <p class="muted">${escapeHtml(story.sinopse)}</p>
        <p class="meta-line">${story.total_capitulos} capítulos · nota ${Number(story.media_avaliacoes || 0).toFixed(1)} (${Number(story.total_avaliacoes || 0)} avaliações)</p>
        ${typeof progresso === 'number' ? `<p class="muted">Seu progresso: ${progresso}%</p>` : ''}
        <div class="inline-actions">
            <button class="btn-primary" data-action="abrir-capitulo" data-story-id="${story.id}" data-chapter-id="${story.progresso_leitor?.capitulo_id || story.capitulo_inicial_id || ''}" type="button">Ler</button>
            <button class="btn-ghost" data-action="salvar-historia" data-story-id="${story.id}" data-categoria="favoritos" type="button">Favoritar</button>
        </div>
        <div class="rating-range-card">
            <label for="story-rating-range" class="muted">Sua avaliação</label>
            <div id="story-rating-hover" class="rating-stars-hover" role="group" aria-label="Selecionar nota" data-rating-selected="5">
                ${[1, 2, 3, 4, 5].map((valor) => `
                    <button type="button" class="hover-star is-active" data-hover-star="${valor}" data-action="avaliar-historia" data-story-id="${story.id}" data-nota="${valor}" aria-label="Avaliar ${valor} estrelas">★</button>
                `).join('')}
            </div>
            <p class="muted rating-hover-tip">Passe o mouse nas estrelas e clique para fixar a nota.</p>
            <input
                id="story-rating-range"
                type="range"
                min="1"
                max="5"
                step="1"
                value="5"
                data-story-id="${story.id}"
                class="rating-range-hidden"
            >
        </div>
        <div class="stack-list">
            ${(story.capitulos || []).map((chapter) => `
                <button class="list-button" data-action="abrir-capitulo" data-story-id="${story.id}" data-chapter-id="${chapter.id}" type="button">
                    <div>
                        <strong>${chapter.ordem}. ${escapeHtml(chapter.titulo)}</strong>
                        <p class="muted">${chapter.tempo_estimado_minutos} min · ${chapter.comentarios} comentários</p>
                    </div>
                    <span>Ler</span>
                </button>
            `).join('')}
        </div>
    `;
    // initialize rating selector with user's own rating if available, otherwise use rounded média
    const initialRating = (typeof story.minha_avaliacao === 'number' && story.minha_avaliacao > 0)
        ? Number(story.minha_avaliacao)
        : Math.max(1, Math.min(5, Math.round(Number(story.media_avaliacoes || 0) || 5)));
    atualizarSeletorAvaliacao(initialRating);
}

function renderBiblioteca() {
    if (!state.biblioteca || !el.bibliotecaCategorias) {
        return;
    }
    el.sumTotal.textContent = String(state.biblioteca.total || 0);
    el.sumLendo.textContent = String(state.biblioteca.lendo || 0);
    el.sumFavoritos.textContent = String(state.biblioteca.favoritos || 0);
    el.sumConcluidos.textContent = String(state.biblioteca.concluidos || 0);
    const categorias = state.biblioteca.categorias || {};
    const ordem = ['Lendo', 'Favoritos', 'Pausados', 'Concluídos'];
    el.bibliotecaCategorias.innerHTML = ordem.map((nome) => {
        const historias = categorias[nome] || [];
        return `
            <section class="shelf-card">
                <div class="section-head">
                    <h3>${nome}</h3>
                    <span class="chip">${historias.length}</span>
                </div>
                <div class="stack-list">
                    ${historias.length ? historias.map((story) => {
                        const tempoTotal = story?.tempo_leitura?.total_segundos || 0;
                        const palavras = story?.total_palavras || 0;
                        const palavrasPorPagina = calcularPalavrasPorPagina();
                        const paginasEstimadas = Math.max(1, Math.ceil(palavras / Math.max(1, palavrasPorPagina)));
                        const tempoPorPagina = paginasEstimadas ? Math.round((tempoTotal || 0) / paginasEstimadas) : 0;
                        return `
                        <button class="list-button" data-action="abrir-historia" data-story-id="${story.id}" type="button">
                            <div class="mini-cover">${renderStoryCover(story)}</div>
                            <div>
                                <strong>${escapeHtml(story.titulo)}</strong>
                                <p class="muted">${escapeHtml(story.autor || 'Autor')}</p>
                                ${tempoTotal ? `<p class="muted">Tempo gasto: ${formatarTempo(tempoTotal)} · ${tempoPorPagina ? `~${formatarTempo(tempoPorPagina)}/página` : ''}</p>` : ''}
                            </div>
                            <span>Ver</span>
                        </button>`;
                    }).join('') : `<p class="placeholder">Sem histórias nesta categoria.</p>`}
                </div>
            </section>
        `;
    }).join('');

    const progresso = state.painel?.leitura?.progresso || [];
    el.bibliotecaProgresso.innerHTML = progresso.length
        ? progresso.map((item) => {
            const tempoTotal = item.historia?.tempo_leitura?.total_segundos || item.tempo_segundos || 0;
            const palavras = item.historia?.total_palavras || 0;
            const palavrasPorPagina = calcularPalavrasPorPagina();
            const paginasEstimadas = Math.max(1, Math.ceil(palavras / Math.max(1, palavrasPorPagina)));
            const tempoPorPagina = paginasEstimadas ? Math.round((tempoTotal || 0) / paginasEstimadas) : 0;
            return `
            <article class="compact-story">
                <div>
                    <div class="mini-cover">${renderStoryCover(item.historia)}</div>
                    <strong>${escapeHtml(item.historia.titulo)}</strong>
                    <p class="muted">${escapeHtml(item.capitulo_titulo || 'Capítulo inicial')}</p>
                    <div class="progress"><span style="width:${item.percentual}%"></span></div>
                    ${tempoTotal ? `<p class="muted">Tempo gasto: ${formatarTempo(tempoTotal)} · ${tempoPorPagina ? `~${formatarTempo(tempoPorPagina)}/página` : ''}</p>` : ''}
                </div>
                <button class="btn-ghost" data-action="abrir-capitulo" data-story-id="${item.historia.id}" data-chapter-id="${item.capitulo_id || item.historia.capitulo_inicial_id || ''}" type="button">Continuar</button>
            </article>
        `;
        }).join('')
        : `<p class="placeholder">Você ainda não tem leituras em andamento.</p>`;
}

function renderEscrever() {
    if (!el.autoriaHistorias) {
        return;
    }
    const historias = state.minhasHistorias || [];
    const livros = historias.map((story) => `
        <article class="writer-book-card ${story.id === state.autoriaSelecionadaId ? 'is-selected' : ''}">
            <button class="writer-book-cover" data-action="selecionar-escrita" data-story-id="${escapeAttribute(story.id)}" type="button" aria-label="Editar ${escapeAttribute(story.titulo)}">
                ${renderStoryCover(story)}
            </button>
            <div class="writer-book-info">
                <strong>${escapeHtml(story.titulo)}</strong>
                <span>${story.total_capitulos} capítulos · ${escapeHtml(story.genero || 'Geral')}</span>
            </div>
        </article>
    `).join('');

    el.autoriaHistorias.innerHTML = `
        <button class="writer-add-book-card" data-action="nova-historia" type="button" aria-label="Adicionar novo livro">
            <span>+</span>
            <strong>Novo livro</strong>
        </button>
        ${livros || `<p class="placeholder writer-empty-state">Sua biblioteca de criação está vazia.</p>`}
    `;

    if (el.capituloHistoriaId) {
        el.capituloHistoriaId.innerHTML = historias.length
            ? historias.map((story) => `<option value="${escapeAttribute(story.id)}">${escapeHtml(story.titulo)}</option>`).join('')
            : `<option value="">Nenhuma história publicada</option>`;
    }
    sincronizarFormularioCapituloAutoria();
}

function renderPainelCapitulosAutoria(story) {
    const capitulos = story.capitulos || [];
    if (!el.writerModalChaptersList) {
        return;
    }
    el.writerModalChaptersList.innerHTML = `
        <div class="writer-chapter-list-head">
            <strong>${capitulos.length} capítulos</strong>
            <button class="btn-primary" data-action="novo-capitulo-autoria" data-story-id="${escapeAttribute(story.id)}" type="button">+ Capítulo</button>
        </div>
        ${capitulos.length ? capitulos.map((chapter) => `
            <article class="writer-chapter-item">
                <div>
                    <strong>${chapter.ordem}. ${escapeHtml(chapter.titulo)}</strong>
                    <p class="muted">${chapter.total_palavras || 0} palavras</p>
                </div>
                <button class="btn-ghost" data-action="editar-capitulo-autoria" data-story-id="${escapeAttribute(story.id)}" data-chapter-id="${escapeAttribute(chapter.id)}" type="button">Editar</button>
            </article>
        `).join('') : `<p class="placeholder">Este livro ainda não tem capítulos.</p>`}
    `;
}

function obterHistoriaAutoriaSelecionada() {
    const historias = state.minhasHistorias || [];
    if (!historias.length) {
        state.autoriaSelecionadaId = null;
        return null;
    }
    const selecionada = historias.find((story) => story.id === state.autoriaSelecionadaId);
    return selecionada || null;
}

function abrirEditorAutoria(storyId = null) {
    state.autoriaSelecionadaId = storyId || null;
    state.capituloEditandoId = null;
    const historia = obterHistoriaAutoriaSelecionada();

    if (el.formNovaHistoria) {
        el.formNovaHistoria.reset();
    }
    if (el.formNovoCapitulo) {
        el.formNovoCapitulo.reset();
    }
    if (el.storyCoverInput) {
        el.storyCoverInput.value = '';
    }
    if (el.historiaEditId) {
        el.historiaEditId.value = historia?.id || '';
    }

    if (historia && el.formNovaHistoria) {
        if (el.formNovaHistoria.elements && el.formNovaHistoria.elements.titulo) {
            el.formNovaHistoria.elements.titulo.value = historia.titulo || '';
        }
        if (el.formNovaHistoria.elements && el.formNovaHistoria.elements.genero) {
            el.formNovaHistoria.elements.genero.value = historia.genero || '';
        }
        if (el.formNovaHistoria.elements && el.formNovaHistoria.elements.sinopse) {
            el.formNovaHistoria.elements.sinopse.value = historia.sinopse || '';
        }
    }

    if (el.writerEditorTitle) {
        el.writerEditorTitle.textContent = historia ? historia.titulo : 'Novo livro';
    }
    if (el.writerEditorMode) {
        el.writerEditorMode.textContent = historia ? 'Editar livro' : 'Criar livro';
    }
    if (el.historiaSubmit) {
        el.historiaSubmit.textContent = historia ? 'Salvar dados do livro' : 'Criar livro';
    }

    if (historia) {
        renderPainelCapitulosAutoria(historia);
        prepararNovoCapitulo(historia.id, false);
    } else {
        renderPainelCapitulosAutoriaVazio();
        sincronizarFormularioCapituloAutoria();
    }

    el.writerEditorModal?.classList.remove('hidden');
    el.writerEditorModal?.setAttribute('aria-hidden', 'false');
    el.formNovaHistoria?.elements?.titulo?.focus();
    renderEscrever();
}

function fecharEditorAutoria() {
    el.writerEditorModal?.classList.add('hidden');
    el.writerEditorModal?.setAttribute('aria-hidden', 'true');
    state.capituloEditandoId = null;
    renderEscrever();
}

function renderPainelCapitulosAutoriaVazio() {
    if (el.writerModalChaptersList) {
        el.writerModalChaptersList.innerHTML = `<p class="placeholder">Crie o livro para liberar capítulos.</p>`;
    }
}

function sincronizarFormularioCapituloAutoria() {
    const historia = obterHistoriaAutoriaSelecionada();
    const editando = Boolean(state.capituloEditandoId);
    const tituloInput = el.formNovoCapitulo?.elements?.titulo;
    const conteudoInput = el.formNovoCapitulo?.elements?.conteudo;

    if (el.capituloHistoriaId) {
        el.capituloHistoriaId.disabled = !historia;
        if (historia) {
            el.capituloHistoriaId.value = historia.id;
        }
    }
    if (el.capituloEditId) {
        el.capituloEditId.value = state.capituloEditandoId || '';
    }
    if (el.capituloFormTitle) {
        el.capituloFormTitle.textContent = historia
            ? (editando ? 'Editar capítulo' : `Capítulos de ${historia.titulo}`)
            : 'Capítulos';
    }
    if (el.capituloFormHint) {
        el.capituloFormHint.textContent = historia
            ? (editando ? 'Altere o título ou conteúdo e salve.' : 'Adicione um capítulo novo ou escolha um existente para editar.')
            : 'Escolha uma capa da sua biblioteca para adicionar ou editar capítulos.';
    }
    if (el.capituloSubmit) {
        el.capituloSubmit.textContent = editando ? 'Salvar capítulo' : 'Adicionar capítulo';
        el.capituloSubmit.disabled = !historia;
    }
    if (el.capituloEditCancel) {
        el.capituloEditCancel.classList.toggle('hidden', !editando);
    }
    if (tituloInput) {
        tituloInput.disabled = !historia;
    }
    if (conteudoInput) {
        conteudoInput.disabled = !historia;
    }
}

function prepararNovoCapitulo(storyId, rolar = false) {
    state.autoriaSelecionadaId = storyId;
    state.capituloEditandoId = null;
    if (el.formNovoCapitulo) {
        el.formNovoCapitulo.reset();
    }
    if (el.capituloEditId) {
        el.capituloEditId.value = '';
    }
    if (el.capituloHistoriaId) {
        el.capituloHistoriaId.value = storyId;
    }
    sincronizarFormularioCapituloAutoria();
    if (rolar) {
        el.formNovoCapitulo?.scrollIntoView({behavior: 'smooth', block: 'center'});
        el.formNovoCapitulo?.elements?.titulo?.focus();
    }
}

function preencherEdicaoCapitulo(storyId, chapterId) {
    const historia = (state.minhasHistorias || []).find((story) => story.id === storyId);
    const capitulo = historia?.capitulos?.find((chapter) => chapter.id === chapterId);
    if (!historia || !capitulo || !el.formNovoCapitulo) {
        showToast('Não foi possível carregar o capítulo para edição.', true);
        return;
    }

    state.autoriaSelecionadaId = storyId;
    state.capituloEditandoId = chapterId;
    el.formNovoCapitulo.elements.historia_id.value = storyId;
    el.formNovoCapitulo.elements.capitulo_id.value = chapterId;
    el.formNovoCapitulo.elements.titulo.value = capitulo.titulo || '';
    el.formNovoCapitulo.elements.conteudo.value = capitulo.conteudo || '';
    sincronizarFormularioCapituloAutoria();
    el.formNovoCapitulo.scrollIntoView({behavior: 'smooth', block: 'center'});
    el.formNovoCapitulo.elements.titulo.focus();
}

function limparEdicaoCapitulo(rolar = false) {
    const storyId = state.autoriaSelecionadaId || el.capituloHistoriaId?.value || '';
    prepararNovoCapitulo(storyId, rolar);
}

function renderVoce() {
    if (!state.painel) {
        return;
    }
    const leitura = state.painel.leitura || {};
    const autoria = state.painel.autoria || {};

    if (el.voceStats) {
        const marcacoes = leitura.marcacoes || [];
        el.voceStats.innerHTML = `
            <h3>Seu resumo</h3>
            <p class="muted">${escapeHtml(leitura.leitor?.painel || '')}</p>
            <div class="summary-cards compact">
                <div class="summary-item"><span>Leituras ativas</span><strong>${(leitura.progresso || []).length}</strong></div>
                <div class="summary-item"><span>Na biblioteca</span><strong>${leitura.biblioteca?.total || 0}</strong></div>
                <div class="summary-item"><span>Publicadas</span><strong>${autoria.total || 0}</strong></div>
            </div>
            <div class="profile-quotes">
                <h4>Citações marcadas</h4>
                ${marcacoes.length ? marcacoes.slice(0, 6).map((item) => {
                    const capa = item.historia_capa || item.capa || item.historia?.capa || '';
                    const data = item.data || item.data_marcacao || '';
                    return `
                    <article class="mark-feed-item">
                        <div class="mark-thumb">${capa ? `<img src="${escapeAttribute(capa)}" alt="capa"/>` : `<div class="cover cover-placeholder small"></div>`}</div>
                        <div>
                            <div class="mark-head">
                                <strong>${escapeHtml(item.usuario || 'Você')}</strong>
                                <small class="muted">${escapeHtml(data)}</small>
                            </div>
                            <p>“${escapeHtml(item.trecho)}”</p>
                            <div class="inline-actions">
                                <button class="btn-ghost" data-action="comentar-marcacao" data-marcacao-id="${escapeAttribute(item.id || '')}" type="button">Comentar</button>
                            </div>
                        </div>
                    </article>`;
                }).join('') : `<p class="placeholder">As partes que você marcar aparecerão aqui.</p>`}
            </div>
        `;
    }

    if (el.voceProgresso) {
        const progresso = leitura.progresso || [];
        el.voceProgresso.innerHTML = progresso.length
            ? progresso.map((item) => `
                <article class="story-row">
                    <div>
                        <strong>${escapeHtml(item.historia.titulo)}</strong>
                        <p class="muted">${escapeHtml(item.capitulo_titulo || 'Capítulo inicial')}</p>
                        <div class="progress"><span style="width:${item.percentual}%"></span></div>
                    </div>
                    <button class="btn-ghost" data-action="abrir-capitulo" data-story-id="${item.historia.id}" data-chapter-id="${item.capitulo_id || item.historia.capitulo_inicial_id || ''}" type="button">Continuar</button>
                </article>
            `).join('')
            : `<p class="placeholder">Nenhuma leitura ativa no momento.</p>`;
    }

    if (el.voceAutoria) {
        const historias = autoria.historias || [];
        el.voceAutoria.innerHTML = historias.length
            ? historias.map((story) => `
                <article class="story-row">
                    <div>
                        <strong>${escapeHtml(story.titulo)}</strong>
                        <p class="muted">${escapeHtml(story.sinopse)}</p>
                    </div>
                    <button class="btn-ghost" data-action="abrir-historia" data-story-id="${story.id}" type="button">Abrir</button>
                </article>
            `).join('')
            : `<p class="placeholder">Você ainda não publicou histórias.</p>`;
    }
}

function renderStoryCard(story) {
    const cardClass = state.page === 'inicio' ? 'story-home-card' : '';
    return `
        <article class="writer-book-card ${cardClass} ${story.id === state.autoriaSelecionadaId ? 'is-selected' : ''}" data-story-id="${escapeAttribute(story.id)}">
            <button class="writer-book-cover" data-action="abrir-historia" data-story-id="${escapeAttribute(story.id)}" type="button" aria-label="Abrir ${escapeAttribute(story.titulo)}">
                ${renderStoryCover(story)}
            </button>
            <div class="writer-book-info">
                <strong>${escapeHtml(story.titulo)}</strong>
                <span>${story.total_capitulos} capítulos · ${escapeHtml(story.genero || 'Geral')}</span>
                        <div class="rating-badge" aria-hidden="false" role="button" tabindex="0" data-action="abrir-historia" data-story-id="${escapeAttribute(story.id)}">
                            <span class="rating-avg">${Number(story.media_avaliacoes || 0).toFixed(1)}</span>
                            <span class="rating-count">(${Number(story.total_avaliacoes || 0)})</span>
                        </div>
            </div>
        </article>
    `;
}

function renderStoryCover(story) {
    if (story?.capa) {
        return `<img class="cover cover-image" src="${escapeAttribute(story.capa)}" alt="Capa de ${escapeAttribute(story.titulo || 'história')}">`;
    }
    return `<div class="cover cover-placeholder" style="background: linear-gradient(135deg, ${story.tema?.accent || '#6387f7'}, #202734);"></div>`;
}

async function recarregarHistoriasComTratamento() {
    try {
        await carregarCatalogo();
        renderHistorias();
        await selecionarHistoriaInicial();
    } catch (error) {
        handleError(error);
    }
}

async function handleStoryActionClick(event) {
    // hover effects are handled by mouseover/mouseout listeners; clicks should be handled below

    const button = event.target.closest('[data-action]');

    if (!button) {
        return;
    }
    const action = button.dataset.action;
    const storyId = button.dataset.storyId;

    try {
        if (action === 'filtrar-genero') {
            state.filtros.genero = button.dataset.genero || '';
            state.filtros.q = '';
            sincronizarInputsBusca();
            await carregarCatalogo();
            if (state.page === 'inicio') {
                renderInicio();
            }
            return;
        }

        if (action === 'nova-historia') {
            abrirEditorAutoria();
            return;
        }

        if (action === 'abrir-historia') {
            window.location.href = `/app/historias?story=${encodeURIComponent(storyId)}`;
            return;
        }

        if (action === 'selecionar-historia') {
            if (state.page !== 'historias') {
                window.location.href = `/app/historias?story=${encodeURIComponent(storyId)}`;
                return;
            }
            await selecionarHistoria(storyId);
            return;
        }

        if (action === 'selecionar-escrita') {
            abrirEditorAutoria(storyId);
            return;
        }

        if (action === 'novo-capitulo-autoria') {
            prepararNovoCapitulo(storyId, true);
            showToast('Pronto para adicionar um novo capítulo.');
            return;
        }

        if (action === 'editar-capitulo-autoria') {
            state.autoriaSelecionadaId = storyId;
            preencherEdicaoCapitulo(storyId, button.dataset.chapterId);
            return;
        }

        if (action === 'salvar-historia') {
            await salvarHistoria(storyId, button.dataset.categoria || 'lendo');
            return;
        }

        if (action === 'avaliar-historia') {
            await avaliarHistoria(storyId, Number(button.dataset.nota || 0));
            return;
        }

        if (action === 'avaliar-historia-range') {
            const range = document.getElementById('story-rating-range');
            const nota = Number(range?.value || 0);
            await avaliarHistoria(storyId, nota);
            return;
        }

        if (action === 'abrir-capitulo') {
            const chapterId = button.dataset.chapterId;
            if (!chapterId) {
                showToast('Esta história ainda não possui capítulo para leitura.', true);
                return;
            }
            await abrirCapitulo(storyId, chapterId);
            return;
        }
    } catch (error) {
        handleError(error);
    }
}

async function publicarHistoria(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(el.formNovaHistoria).entries());
    try {
        const editando = Boolean(payload.historia_id);
        const coverFile = el.storyCoverInput?.files?.[0];
        if (coverFile) {
            const tiposPermitidos = new Set(['image/png', 'image/jpeg', 'image/webp']);
            if (!tiposPermitidos.has(coverFile.type)) {
                showToast('Formato de capa inválido. Use PNG, JPG ou WEBP.', true);
                return;
            }
            if (coverFile.size > 2 * 1024 * 1024) {
                showToast('Capa muito grande. Use até 2MB.', true);
                return;
            }
            payload.capa = await lerArquivoComoDataURL(coverFile);
        }
        // suporte a EPUB e preview (MOV/MP4)
        const epubFile = el.storyFileInput?.files?.[0];
        if (epubFile) {
            const tiposPermitidosEpub = new Set(['application/epub+zip', 'application/octet-stream']);
            const name = String(epubFile.name || '').toLowerCase();
            if (!tiposPermitidosEpub.has(epubFile.type) && !name.endsWith('.epub')) {
                showToast('Formato de arquivo EPUB inválido. Use .epub.', true);
                return;
            }
            if (epubFile.size > 20 * 1024 * 1024) {
                showToast('EPUB muito grande. Use até 20MB.', true);
                return;
            }
            payload.epub = await lerArquivoComoDataURL(epubFile);
        }
        const previewFile = el.storyPreviewInput?.files?.[0];
        if (previewFile) {
            const tiposPermitidosPreview = new Set(['video/quicktime', 'video/mp4']);
            if (!tiposPermitidosPreview.has(previewFile.type)) {
                showToast('Formato de preview inválido. Use MOV ou MP4.', true);
                return;
            }
            if (previewFile.size > 10 * 1024 * 1024) {
                showToast('Preview muito grande. Use até 10MB.', true);
                return;
            }
            payload.preview = await lerArquivoComoDataURL(previewFile);
        }

        const endpoint = editando
            ? `/me/autoria/historias/${encodeURIComponent(payload.historia_id)}`
            : '/me/autoria/historias';
        const response = await api(endpoint, {method: editando ? 'PUT' : 'POST', body: payload});
        showToast(response.mensagem || (editando ? 'Livro atualizado com sucesso.' : 'História publicada com sucesso.'));
        el.formNovaHistoria.reset();
        if (el.storyCoverInput) {
            el.storyCoverInput.value = '';
        }
        await carregarAutoria();
        state.autoriaSelecionadaId = response.historia?.id || response.id || payload.historia_id || null;
        state.capituloEditandoId = null;
        renderEscrever();
        abrirEditorAutoria(state.autoriaSelecionadaId);
    } catch (error) {
        handleError(error);
    }
}

async function publicarCapitulo(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(el.formNovoCapitulo).entries());
    if (!payload.historia_id) {
        showToast('Selecione uma história antes de adicionar capítulo.', true);
        return;
    }
    try {
        const editando = Boolean(payload.capitulo_id);
        const endpoint = editando
            ? `/me/autoria/historias/${encodeURIComponent(payload.historia_id)}/capitulos/${encodeURIComponent(payload.capitulo_id)}`
            : `/me/autoria/historias/${encodeURIComponent(payload.historia_id)}/capitulos`;
        const response = await api(endpoint, {
            method: editando ? 'PUT' : 'POST',
            body: {
                titulo: payload.titulo,
                conteudo: payload.conteudo,
            },
        });
        showToast(response.mensagem || (editando ? 'Capítulo atualizado com sucesso.' : 'Capítulo adicionado com sucesso.'));
        state.autoriaSelecionadaId = payload.historia_id;
        state.capituloEditandoId = null;
        el.formNovoCapitulo.reset();
        await carregarAutoria();
        renderEscrever();
        abrirEditorAutoria(state.autoriaSelecionadaId);
    } catch (error) {
        handleError(error);
    }
}

async function salvarHistoria(storyId, categoria) {
    const response = await api('/me/biblioteca', {
        method: 'POST',
        body: {
            historia_id: storyId,
            categoria: normalizarCategoria(categoria),
        },
    });
    showToast(response.mensagem || 'História salva na biblioteca.');
    await Promise.all([carregarPainel(), carregarBiblioteca()]);
    if (state.page === 'inicio') {
        renderInicio();
    } else if (state.page === 'biblioteca') {
        renderBiblioteca();
    } else if (state.page === 'voce') {
        renderVoce();
    }
}

async function avaliarHistoria(storyId, nota) {
    if (!nota || nota < 1 || nota > 5) {
        showToast('Nota inválida.', true);
        return;
    }
    const response = await api('/me/avaliar', {
        method: 'POST',
        body: {historia_id: storyId, nota},
    });
    showToast(response.mensagem || 'Avaliação registrada.');

    // Update only the affected story in state to avoid full reload
    try {
        const media = Number(response.media_atual || 0);
        const total = Number(response.total_avaliacoes || 0);

        // update catalog item
        const idx = state.catalogo.findIndex((s) => s.id === storyId);
        if (idx >= 0) {
            state.catalogo[idx].media_avaliacoes = media;
            state.catalogo[idx].total_avaliacoes = total;
        }

        // animate micro-feedback badge on the card if present
        try {
            const cardBadge = document.querySelector(`.writer-book-card[data-story-id="${storyId}"] .rating-badge`);
            if (cardBadge) {
                cardBadge.classList.remove('pulse');
                // reflow to restart animation
                // eslint-disable-next-line no-unused-expressions
                cardBadge.offsetWidth;
                cardBadge.classList.add('pulse');
                setTimeout(() => cardBadge.classList.remove('pulse'), 700);
                // update numbers in the badge
                const avgEl = cardBadge.querySelector('.rating-avg');
                const cntEl = cardBadge.querySelector('.rating-count');
                if (avgEl) avgEl.textContent = media.toFixed(1);
                if (cntEl) cntEl.textContent = `(${total})`;
            }
        } catch (e) {
            // ignore animation errors
        }

        // update detail view if open
        if (state.historiaDetalhe && state.historiaDetalhe.id === storyId) {
            state.historiaDetalhe.media_avaliacoes = media;
            state.historiaDetalhe.total_avaliacoes = total;
            state.historiaDetalhe.minha_avaliacao = nota;
            atualizarSeletorAvaliacao(nota);
            renderDetalheHistoria();
        }

        // refresh lists that show média
        if (state.page === 'historias') {
            renderHistorias();
        } else if (state.page === 'inicio') {
            renderInicio();
        }
    } catch (e) {
        // fallback: reload catalog and detail
        await carregarCatalogo();
        try { await selecionarHistoria(storyId); } catch (err) {}
        if (state.page === 'historias') renderHistorias(); else renderDetalheHistoria();
    }
}

async function abrirCapitulo(storyId, chapterId, options = {}) {
    await registrarTempoLeituraAtual();
    const response = await api(`/me/historias/${encodeURIComponent(storyId)}/capitulos/${encodeURIComponent(chapterId)}`);
    const paginaInicial = options.paginaInicial || 'primeira';
    state.capituloAtivo = response;
    renderModalLeitura(paginaInicial);
    iniciarSessaoLeitura();
    el.readerModal?.classList.remove('hidden');
    el.readerModal?.setAttribute('aria-hidden', 'false');
}

function renderModalLeitura(paginaInicial = 'manter') {
    if (!state.capituloAtivo) {
        return;
    }
    const {historia, capitulo} = state.capituloAtivo;
    definirPainelLeitorInicial();
    if (el.readerStoryName) {
        el.readerStoryName.textContent = `${historia.titulo} · ${historia.autor || 'Autor'}`;
    }
    if (el.readerBookTitleTop) {
        el.readerBookTitleTop.textContent = historia.titulo || '';
    }
    if (el.readerChapterTitle) {
        el.readerChapterTitle.textContent = capitulo.titulo;
    }
    if (el.readerMeta) {
        el.readerMeta.textContent = `Capítulo ${capitulo.ordem}: ${capitulo.titulo}`;
    }
    el.readerSampleBanner?.classList.remove('hidden');
    renderReaderChapterSelect();
    sincronizarControlesLeitor();
    aplicarPaginacaoCapitulo(paginaInicial);
    if (el.readerCommentsCount) {
        el.readerCommentsCount.textContent = String((capitulo.comentarios_recentes || []).length);
    }
    if (el.readerComments) {
        el.readerComments.innerHTML = (capitulo.comentarios_recentes || []).length
            ? capitulo.comentarios_recentes.map((comment) => `
                <article class="comment-item">
                    <strong style="color:${escapeAttribute(corNomeUsuario(comment.usuario))};">${escapeHtml(comment.usuario)}</strong>
                    <p class="muted">${escapeHtml(comment.conteudo)}</p>
                    ${comment.usuario_id === state.user?.leitor_id ? `
                        <div class="inline-actions">
                            <button class="btn-ghost" data-action="edit-comment" data-comment-id="${comment.id}" type="button">Editar</button>
                            <button class="btn-ghost" data-action="delete-comment" data-comment-id="${comment.id}" type="button">Excluir</button>
                        </div>
                    ` : ''}
                </article>
            `).join('')
            : `<p class="placeholder">Seja o primeiro comentário neste capítulo.</p>`;
    }

    renderMarcacoesLeitor();
    renderSessoesLeitura();
    atualizarTempoPrevisto();
    atualizarTempoLeituraUI();
}

function renderReaderChapterSelect() {
    if (!state.capituloAtivo) {
        return;
    }

    const capitulos = state.capituloAtivo.historia?.capitulos || [];
    const capituloAtualId = state.capituloAtivo.capitulo?.id;
    if (el.readerChapterSelect) {
        el.readerChapterSelect.innerHTML = capitulos.length
            ? capitulos.map((chapter) => `
                <option value="${escapeAttribute(chapter.id)}" ${chapter.id === capituloAtualId ? 'selected' : ''}>
                    ${chapter.ordem}. ${escapeHtml(chapter.titulo)}
                </option>
            `).join('')
            : `<option value="">Sem capítulos</option>`;
        el.readerChapterSelect.disabled = !capitulos.length;
    }
    if (el.readerTocList) {
        el.readerTocList.innerHTML = '';
    }
}

function alternarPainelLeitor(panel) {
    if (!el.readerSidePanel || !['toc', 'settings'].includes(panel)) {
        return;
    }
    el.readerSidePanel.dataset.panel = panel;
    el.readerSidePanel.classList.remove('is-collapsed');
    el.readerShowToc?.classList.toggle('is-active', panel === 'toc');
    el.readerShowSettings?.classList.toggle('is-active', panel === 'settings');
}

function definirPainelLeitorInicial() {
    if (!el.readerSidePanel) {
        return;
    }
    el.readerSidePanel.dataset.panel = 'settings';
    el.readerSidePanel.classList.add('is-collapsed');
    el.readerShowToc?.classList.remove('is-active');
    el.readerShowSettings?.classList.remove('is-active');
}

function aplicarPaginacaoCapitulo(paginaInicial = 'manter') {
    if (!state.capituloAtivo) {
        return;
    }

    const conteudo = state.capituloAtivo.capitulo?.conteudo || '';
    const palavrasPorPagina = calcularPalavrasPorPagina();
    state.readerPagination.wordsPerPage = palavrasPorPagina;
    state.readerPagination.pages = paginarTextoPorPalavras(conteudo, palavrasPorPagina);

    if (!state.readerPagination.pages.length) {
        state.readerPagination.pages = [''];
    }

    if (paginaInicial === 'primeira') {
        state.readerPagination.currentPage = 0;
    } else if (paginaInicial === 'ultima') {
        state.readerPagination.currentPage = state.readerPagination.pages.length - 1;
    } else {
        state.readerPagination.currentPage = Math.min(
            state.readerPagination.currentPage,
            state.readerPagination.pages.length - 1,
        );
    }

    renderPaginaAtualLeitura();
}

function calcularPalavrasPorPagina() {
    const baseMax = 200;
    const tamanhoFonte = Number(state.readerPrefs.fontSize || 19);
    const escala = 18 / Math.max(16, tamanhoFonte);
    const ajustado = Math.floor(baseMax * escala);
    return Math.max(70, Math.min(baseMax, ajustado));
}

function paginarTextoPorPalavras(conteudo, palavrasPorPagina) {
    const palavras = String(conteudo || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!palavras.length) {
        return [];
    }

    const paginas = [];
    for (let index = 0; index < palavras.length; index += palavrasPorPagina) {
        paginas.push(palavras.slice(index, index + palavrasPorPagina).join(' '));
    }
    return paginas;
}

function obterTotalPaginasDoCapitulo(totalPalavras, palavrasPorPagina) {
    const palavras = Math.max(0, Number(totalPalavras) || 0);
    const limite = Math.max(1, Number(palavrasPorPagina) || 200);
    return Math.max(1, Math.ceil(palavras / limite));
}

function calcularContadorGlobalLivro() {
    const paginasLocais = state.readerPagination.pages || [];
    const indiceLocal = state.readerPagination.currentPage || 0;
    const paginaLocalAtual = indiceLocal + 1;
    const totalPaginasLocais = paginasLocais.length || 1;
    const palavrasPorPagina = state.readerPagination.wordsPerPage || calcularPalavrasPorPagina();
    const capitulosLivro = state.capituloAtivo?.historia?.capitulos;
    const capituloAtualId = state.capituloAtivo?.capitulo?.id;

    if (!Array.isArray(capitulosLivro) || !capitulosLivro.length || !capituloAtualId) {
        return {
            paginaAtual: paginaLocalAtual,
            totalPaginas: totalPaginasLocais,
        };
    }

    let paginasAntesDoCapituloAtual = 0;
    let totalPaginasLivro = 0;
    let capituloEncontrado = false;

    for (const capitulo of capitulosLivro) {
        const totalPaginasCapitulo = obterTotalPaginasDoCapitulo(capitulo.total_palavras, palavrasPorPagina);
        totalPaginasLivro += totalPaginasCapitulo;

        if (!capituloEncontrado) {
            if (capitulo.id === capituloAtualId) {
                capituloEncontrado = true;
            } else {
                paginasAntesDoCapituloAtual += totalPaginasCapitulo;
            }
        }
    }

    if (!capituloEncontrado) {
        return {
            paginaAtual: paginaLocalAtual,
            totalPaginas: Math.max(totalPaginasLocais, totalPaginasLivro),
        };
    }

    return {
        paginaAtual: Math.max(1, Math.min(totalPaginasLivro, paginasAntesDoCapituloAtual + paginaLocalAtual)),
        totalPaginas: Math.max(1, totalPaginasLivro),
    };
}

function obterDestaquesDaPagina(textoPagina) {
    const destaques = state.capituloAtivo?.capitulo?.destaques || {};
    const normalizarTexto = (valor) => String(valor || '').toLocaleLowerCase('pt-BR');
    const textoNormalizado = normalizarTexto(textoPagina);
    const meus = new Set((destaques.meus || []).map(normalizarTexto));
    const lista = [
        ...(destaques.recomendados || []).map((item) => ({...item, tipo: 'popular'})),
        ...(destaques.meus || []).map((trecho) => ({trecho, tipo: 'meu'})),
    ];

    return lista
        .filter((item) => item.trecho && textoNormalizado.includes(normalizarTexto(item.trecho)))
        .map((item) => ({
            ...item,
            tipo: meus.has(normalizarTexto(item.trecho)) ? 'meu' : item.tipo,
        }))
        .sort((a, b) => String(b.trecho).length - String(a.trecho).length);
}

function renderTextoComDestaques(texto, destaques) {
    let resultado = escapeHtml(texto);
    for (const destaque of destaques) {
        const trecho = String(destaque.trecho || '');
        if (!trecho) {
            continue;
        }
        const classe = destaque.tipo === 'meu' ? 'reader-highlight-user' : 'reader-highlight-popular';
        const escapedTrecho = escapeHtml(trecho);
        resultado = resultado.split(escapedTrecho).join(`<mark class="${classe}">${escapedTrecho}</mark>`);
    }
    return resultado;
}

function renderMarcacoesLeitor() {
    if (!el.readerMarksList || !state.capituloAtivo) {
        return;
    }

    const destaques = state.capituloAtivo.capitulo?.destaques || {};
    const meus = destaques.meus || [];
    const recomendados = destaques.recomendados || [];
    const itens = [
        ...meus.map((trecho) => ({trecho, tipo: 'meu'})),
        ...recomendados
            .filter((item) => !meus.some((trecho) => String(trecho).toLocaleLowerCase('pt-BR') === String(item.trecho).toLocaleLowerCase('pt-BR')))
            .map((item) => ({...item, tipo: 'popular'})),
    ];

    if (el.readerMarksCount) {
        el.readerMarksCount.textContent = String(meus.length);
    }

    el.readerMarksList.innerHTML = itens.length
        ? itens.map((item) => `
            <article class="reader-mark-item">
                <div class="reader-mark-avatar">${escapeHtml((state.user?.nome || 'U').slice(0, 1).toUpperCase())}</div>
                <div>
                    <div class="reader-mark-head">
                        <strong>${item.tipo === 'meu' ? 'Você marcou' : 'Muito marcada'}</strong>
                        ${item.tipo === 'popular' ? `<span>${item.percentual || 60}% dos leitores</span>` : ''}
                    </div>
                    <p>${escapeHtml(item.trecho)}</p>
                    ${item.tipo === 'meu' ? `
                        <button class="mark-remove-btn" data-action="remove-highlight" data-highlight-text="${escapeAttribute(item.trecho)}" type="button">
                            Remover marcação
                        </button>
                    ` : ''}
                </div>
            </article>
        `).join('')
        : `<p class="placeholder">Os trechos destacados vão aparecer aqui.</p>`;
}

function renderPaginaAtualLeitura() {
    const paginas = state.readerPagination.pages || [];
    const indice = state.readerPagination.currentPage || 0;
    const total = paginas.length || 1;
    const paginaAtual = paginas[indice] || '';
    const contadorLivro = calcularContadorGlobalLivro();
    const hasPrevChapter = Boolean(state.capituloAtivo?.navegacao?.anterior_id);
    const hasNextChapter = Boolean(state.capituloAtivo?.navegacao?.proximo_id);
    const hasGlobalPrev = indice > 0 || hasPrevChapter;
    const hasGlobalNext = indice < total - 1 || hasNextChapter;
    state.readerPagination.currentGlobalPage = contadorLivro.paginaAtual;

    const blocos = dividirPaginaEmParagrafos(paginaAtual, 42);
    const destaquesDaPagina = obterDestaquesDaPagina(paginaAtual);
    aplicarPreferenciasVisuaisLeitor();

    const metade = Math.ceil(blocos.length / 2);
    const blocosEsquerda = blocos.slice(0, metade);
    const blocosDireita = blocos.slice(metade);
    const renderBlocos = (items, incluirTitulo = false) => `
        <article class="reader-page">
            ${incluirTitulo ? `<h3>${escapeHtml(state.capituloAtivo?.capitulo?.titulo || 'Capítulo')}</h3>` : ''}
            ${items.length
                ? items.map((paragrafo) => `<p>${renderTextoComDestaques(paragrafo, destaquesDaPagina)}</p>`).join('')
                : (indice === 0 && incluirTitulo ? '<p>Este capítulo ainda não possui conteúdo.</p>' : '')}
        </article>
    `;

    el.readerContent.innerHTML = `
        <div class="reader-pages">
            <div class="reader-spread">
                ${renderBlocos(blocosEsquerda, indice === 0)}
                ${renderBlocos(blocosDireita)}
            </div>
        </div>
    `;

    if (el.readerPageCounter) {
        const percentual = Math.max(1, Math.round((contadorLivro.paginaAtual / contadorLivro.totalPaginas) * 100));
        el.readerPageCounter.textContent = `Local ${contadorLivro.paginaAtual} de ${contadorLivro.totalPaginas} • ${percentual}%`;
    }
    if (el.readerProgressRange) {
        el.readerProgressRange.max = String(total);
        el.readerProgressRange.value = String(indice + 1);
    }
    if (el.readerPagePrev) {
        el.readerPagePrev.disabled = !hasGlobalPrev;
    }
    if (el.readerPageNext) {
        el.readerPageNext.disabled = !hasGlobalNext;
    }
    renderMarcacoesLeitor();
    reiniciarTempoDaPagina();
    atualizarTempoLeituraUI();
}

function dividirPaginaEmParagrafos(texto, palavrasPorBloco = 42) {
    const palavras = String(texto || '').trim().split(/\s+/).filter(Boolean);
    if (!palavras.length) {
        return [];
    }
    const blocos = [];
    for (let i = 0; i < palavras.length; i += palavrasPorBloco) {
        blocos.push(palavras.slice(i, i + palavrasPorBloco).join(' '));
    }
    return blocos;
}

async function navegarPaginaAnterior() {
    await registrarTempoLeituraAtual();
    if (state.readerPagination.currentPage > 0) {
        state.readerPagination.currentPage -= 1;
        renderPaginaAtualLeitura();
        return;
    }

    const anteriorId = state.capituloAtivo?.navegacao?.anterior_id;
    const historiaId = state.capituloAtivo?.historia?.id;
    if (!anteriorId || !historiaId) {
        return;
    }

    await abrirCapitulo(historiaId, anteriorId, {paginaInicial: 'ultima'});
}

async function navegarProximaPagina() {
    await registrarTempoLeituraAtual();
    const total = state.readerPagination.pages.length;
    if (state.readerPagination.currentPage < total - 1) {
        state.readerPagination.currentPage += 1;
        renderPaginaAtualLeitura();
        return;
    }

    const proximoId = state.capituloAtivo?.navegacao?.proximo_id;
    const historiaId = state.capituloAtivo?.historia?.id;
    if (!proximoId || !historiaId) {
        return;
    }

    await abrirCapitulo(historiaId, proximoId, {paginaInicial: 'primeira'});
}

function handleReaderPreferenceOptionClick(event) {
    const botaoFonte = event.target.closest('[data-reader-font]');
    if (botaoFonte && READER_FONTS.has(botaoFonte.dataset.readerFont || '')) {
        state.readerPrefs.fontFamily = botaoFonte.dataset.readerFont;
        onReaderPreferenceChanged();
        return;
    }

    const botaoFundo = event.target.closest('[data-reader-bg]');
    if (botaoFundo && READER_BACKGROUNDS.has(botaoFundo.dataset.readerBg || '')) {
        state.readerPrefs.bgColor = botaoFundo.dataset.readerBg;
        onReaderPreferenceChanged();
    }
}

function onReaderPreferenceChanged() {
    const fontSize = Number(el.readerFontSize?.value || state.readerPrefs.fontSize || 19);
    state.readerPrefs.fontSize = Math.max(16, Math.min(30, fontSize));

    if (el.readerFontSizeValue) {
        el.readerFontSizeValue.textContent = `${state.readerPrefs.fontSize}px`;
    }

    sincronizarControlesLeitor();
    aplicarPreferenciasVisuaisLeitor();
    salvarPreferenciasLeitor();
    aplicarPaginacaoCapitulo('manter');
}

function carregarPreferenciasLeitor() {
    try {
        const raw = localStorage.getItem('storyflow_reader_prefs');
        if (!raw) {
            return;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            if (typeof parsed.fontFamily === 'string' && READER_FONTS.has(parsed.fontFamily)) {
                state.readerPrefs.fontFamily = parsed.fontFamily;
            }
            if (typeof parsed.fontSize === 'number') {
                state.readerPrefs.fontSize = Math.max(16, Math.min(30, parsed.fontSize));
            }
            if (typeof parsed.bgColor === 'string' && READER_BACKGROUNDS.has(parsed.bgColor)) {
                state.readerPrefs.bgColor = parsed.bgColor;
            }
        }
    } catch (error) {
        // Preferências inválidas são ignoradas.
    }
}

function salvarPreferenciasLeitor() {
    localStorage.setItem('storyflow_reader_prefs', JSON.stringify(state.readerPrefs));
}

function sincronizarControlesLeitor() {
    if (el.readerFontSize) {
        el.readerFontSize.value = String(state.readerPrefs.fontSize);
    }
    if (el.readerFontSizeValue) {
        el.readerFontSizeValue.textContent = `${state.readerPrefs.fontSize}px`;
    }

    if (el.readerFontOptions) {
        const fontButtons = el.readerFontOptions.querySelectorAll('[data-reader-font]');
        fontButtons.forEach((button) => {
            const ativo = button.dataset.readerFont === state.readerPrefs.fontFamily;
            button.classList.toggle('is-active', ativo);
            button.setAttribute('aria-pressed', ativo ? 'true' : 'false');
        });
    }

    if (el.readerBgOptions) {
        const bgButtons = el.readerBgOptions.querySelectorAll('[data-reader-bg]');
        bgButtons.forEach((button) => {
            const ativo = button.dataset.readerBg === state.readerPrefs.bgColor;
            button.classList.toggle('is-active', ativo);
            button.setAttribute('aria-pressed', ativo ? 'true' : 'false');
        });
    }
}

function aplicarPreferenciasVisuaisLeitor() {
    if (!el.readerContent) {
        return;
    }
    el.readerContent.dataset.font = state.readerPrefs.fontFamily;
    el.readerContent.dataset.bg = state.readerPrefs.bgColor;
    el.readerContent.style.setProperty('--reader-font-size', `${state.readerPrefs.fontSize}px`);
    if (el.readerCard) {
        el.readerCard.dataset.bg = state.readerPrefs.bgColor;
    }
}

function iniciarSessaoLeitura() {
    const agora = Date.now();
    if (!state.readerSession.id) {
        state.readerSession.id = `sessao-${agora}-${Math.random().toString(36).slice(2, 10)}`;
    }
    if (!state.readerSession.startedAt) {
        state.readerSession.startedAt = agora;
    }
    state.readerSession.pageStartedAt = agora;
    if (!state.readerSession.intervalId) {
        state.readerSession.intervalId = window.setInterval(atualizarTempoLeituraUI, 1000);
    }
    if (!state.readerSession.autoSaveIntervalId) {
        state.readerSession.autoSaveIntervalId = window.setInterval(() => {
            salvarProgressoLeitura().catch(() => {});
        }, 15000);
    }
    atualizarTempoLeituraUI();
}

function reiniciarTempoDaPagina() {
    state.readerSession.pageStartedAt = Date.now();
}

function segundosDesde(timestamp) {
    if (!timestamp) {
        return 0;
    }
    return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
}

function formatarTempo(segundos) {
    const total = Math.max(0, Number(segundos) || 0);
    const minutos = Math.floor(total / 60);
    const resto = total % 60;
    return `${minutos}:${String(resto).padStart(2, '0')}`;
}

function obterTempoCapituloAtual() {
    const tempo = state.capituloAtivo?.tempo_leitura || state.capituloAtivo?.historia?.tempo_leitura;
    const capituloId = state.capituloAtivo?.capitulo?.id;
    const capitulo = tempo?.capitulos?.[capituloId];
    return Number(capitulo?.total_segundos || 0);
}

function obterTempoLivroAtual() {
    const tempo = state.capituloAtivo?.tempo_leitura || state.capituloAtivo?.historia?.tempo_leitura;
    return Number(tempo?.total_segundos || 0);
}

function obterSessoesLivroAtual() {
    const tempo = state.capituloAtivo?.tempo_leitura || state.capituloAtivo?.historia?.tempo_leitura;
    const sessoes = tempo?.sessoes;
    if (!sessoes || typeof sessoes !== 'object') {
        return [];
    }
    return Object.values(sessoes)
        .filter((sessao) => sessao && typeof sessao === 'object')
        .sort((a, b) => String(b.atualizada_em || '').localeCompare(String(a.atualizada_em || '')));
}

function renderSessoesLeitura() {
    if (!el.readerSessionsList || !el.readerSessionsCount) {
        return;
    }

    const sessoes = obterSessoesLivroAtual();
    el.readerSessionsCount.textContent = String(sessoes.length);

    if (!sessoes.length) {
        el.readerSessionsList.innerHTML = '<p class="placeholder">As sessões de leitura do livro aparecem aqui.</p>';
        return;
    }

    el.readerSessionsList.innerHTML = sessoes.slice(0, 6).map((sessao) => {
        const horario = formatarHorarioSessao(sessao.atualizada_em || sessao.iniciada_em);
        return `
            <article class="reader-session-item">
                <strong>${formatarTempo(sessao.total_segundos || 0)}</strong>
                <span>${escapeHtml(horario)}</span>
            </article>
        `;
    }).join('');
}

function formatarHorarioSessao(isoString) {
    if (!isoString) {
        return 'Agora';
    }
    const data = new Date(isoString);
    if (Number.isNaN(data.getTime())) {
        return 'Agora';
    }
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function atualizarTempoPrevisto() {
    if (!el.readerPredictedValue) {
        return;
    }
    const totalPaginas = Math.max(1, state.readerPagination.pages.length || 1);
    const paginaAtual = Math.max(1, (state.readerPagination.currentPage || 0) + 1);
    const restantes = Math.max(0, totalPaginas - paginaAtual);

    const tempoEstimadoCapitulo = Number(state.capituloAtivo?.capitulo?.tempo_estimado_minutos || 0) * 60;
    let mediaPorPagina = tempoEstimadoCapitulo
        ? Math.max(25, Math.round(tempoEstimadoCapitulo / totalPaginas))
        : 45;

    const tempoRealCapitulo = obterTempoCapituloAtual();
    if (tempoRealCapitulo > 0) {
        mediaPorPagina = Math.max(20, Math.round(tempoRealCapitulo / paginaAtual));
    }

    el.readerPredictedValue.textContent = formatarTempo(restantes * mediaPorPagina);
}

function atualizarTempoLeituraUI() {
    const paginaSegundos = segundosDesde(state.readerSession.pageStartedAt);
    const sessaoSegundos = segundosDesde(state.readerSession.startedAt);
    if (el.readerSessionTime) {
        el.readerSessionTime.textContent = formatarTempo(sessaoSegundos);
    }
    if (el.readerPageTime) {
        el.readerPageTime.textContent = formatarTempo(paginaSegundos);
    }
    if (el.readerChapterTime) {
        el.readerChapterTime.textContent = formatarTempo(obterTempoCapituloAtual() + paginaSegundos);
    }
    if (el.readerBookTime) {
        el.readerBookTime.textContent = formatarTempo(obterTempoLivroAtual() + paginaSegundos);
    }
    atualizarTempoPrevisto();
}

async function registrarTempoLeituraAtual() {
    if (!state.capituloAtivo || !state.readerSession.pageStartedAt) {
        return;
    }
    const segundos = segundosDesde(state.readerSession.pageStartedAt);
    if (segundos < 2) {
        reiniciarTempoDaPagina();
        return;
    }
    reiniciarTempoDaPagina();

    try {
        const response = await api('/me/tempo-leitura', {
            method: 'POST',
            body: {
                historia_id: state.capituloAtivo.historia.id,
                capitulo_id: state.capituloAtivo.capitulo.id,
                pagina_global: state.readerPagination.currentGlobalPage || 1,
                segundos,
                sessao_id: state.readerSession.id,
            },
        });
        if (response.tempo_leitura) {
            state.capituloAtivo.tempo_leitura = response.tempo_leitura;
        }
        renderSessoesLeitura();
        atualizarTempoLeituraUI();
    } catch (error) {
        state.readerSession.unsentSeconds += segundos;
    }
}

async function destacarSelecaoAtual() {
    if (!state.capituloAtivo) {
        return;
    }
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    const origemValida = range && el.readerContent?.contains(range.commonAncestorContainer);
    if (!origemValida) {
        showToast('Selecione um trecho dentro da página de leitura.', true);
        return;
    }
    const trecho = selection ? String(selection.toString()).trim() : '';
    if (!trecho) {
        showToast('Selecione um trecho da página para destacar.', true);
        return;
    }

    try {
        const response = await api('/me/destaques', {
            method: 'POST',
            body: {
                historia_id: state.capituloAtivo.historia.id,
                capitulo_id: state.capituloAtivo.capitulo.id,
                trecho,
            },
        });
        if (response.destaques) {
            state.capituloAtivo.capitulo.destaques = response.destaques;
        }
        selection?.removeAllRanges();
        renderMarcacoesLeitor();
        renderPaginaAtualLeitura();
        showToast(response.mensagem || 'Trecho destacado.');
    } catch (error) {
        handleError(error);
    }
}

async function handleReaderMarksClick(event) {
    const button = event.target.closest('[data-action="remove-highlight"]');
    if (!button || !state.capituloAtivo) {
        return;
    }

    try {
        const response = await api('/me/destaques', {
            method: 'DELETE',
            body: {
                historia_id: state.capituloAtivo.historia.id,
                capitulo_id: state.capituloAtivo.capitulo.id,
                trecho: button.dataset.highlightText || '',
            },
        });
        if (response.destaques) {
            state.capituloAtivo.capitulo.destaques = response.destaques;
        }
        renderMarcacoesLeitor();
        renderPaginaAtualLeitura();
        showToast(response.mensagem || 'Marcação removida.');
    } catch (error) {
        handleError(error);
    }
}

async function fecharLeitor() {
    await registrarTempoLeituraAtual();
    if (state.readerSession.intervalId) {
        window.clearInterval(state.readerSession.intervalId);
    }
    if (state.readerSession.autoSaveIntervalId) {
        window.clearInterval(state.readerSession.autoSaveIntervalId);
    }
    state.readerSession = {
        id: null,
        startedAt: null,
        pageStartedAt: null,
        intervalId: null,
        autoSaveIntervalId: null,
        unsentSeconds: 0,
    };
    definirPainelLeitorInicial();
    el.readerModal?.classList.add('hidden');
    el.readerModal?.setAttribute('aria-hidden', 'true');
}

async function salvarProgressoLeitura(percentualForcado) {
    if (!state.capituloAtivo) {
        return;
    }

    const historiaId = state.capituloAtivo.historia.id;
    let percentual = percentualForcado;
    if (typeof percentual !== 'number') {
        const totalCapitulos = state.historiaDetalhe?.id === historiaId
            ? state.historiaDetalhe.total_capitulos
            : (state.catalogo.find((story) => story.id === historiaId)?.total_capitulos || state.capituloAtivo.capitulo.ordem);
        percentual = Math.min(100, Math.round((state.capituloAtivo.capitulo.ordem / Math.max(1, totalCapitulos)) * 100));
    }

    try {
        const response = await api('/me/progresso', {
            method: 'POST',
            body: {
                historia_id: historiaId,
                capitulo_id: state.capituloAtivo.capitulo.id,
                percentual,
            },
        });
        showToast(response.mensagem || 'Progresso atualizado.');
        await atualizarDadosPosLeitura(historiaId);
    } catch (error) {
        handleError(error);
    }
}

async function comentarCapituloAtual(event) {
    event.preventDefault();
    if (!state.capituloAtivo || !el.readerCommentInput.value.trim()) {
        return;
    }
    try {
        const response = await api('/me/comentar', {
            method: 'POST',
            body: {
                historia_id: state.capituloAtivo.historia.id,
                capitulo_id: state.capituloAtivo.capitulo.id,
                conteudo: el.readerCommentInput.value.trim(),
            },
        });
        showToast(response.mensagem || 'Comentário enviado.');
        el.readerCommentInput.value = '';
        await abrirCapitulo(
            state.capituloAtivo.historia.id,
            state.capituloAtivo.capitulo.id,
            {paginaInicial: 'manter'},
        );
    } catch (error) {
        handleError(error);
    }
}

async function handleCommentActionClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button || !state.capituloAtivo) {
        return;
    }

    const action = button.dataset.action;
    if (!['edit-comment', 'delete-comment'].includes(action)) {
        return;
    }

    const comentarioId = button.dataset.commentId;
    const historiaId = state.capituloAtivo.historia.id;
    const capituloId = state.capituloAtivo.capitulo.id;
    const comentarioAtual = (state.capituloAtivo.capitulo.comentarios_recentes || [])
        .find((item) => item.id === comentarioId);

    if (!comentarioAtual) {
        showToast('Comentário não encontrado.', true);
        return;
    }

    try {
        if (action === 'edit-comment') {
            const novoConteudo = prompt('Editar comentário:', comentarioAtual.conteudo || '');
            if (novoConteudo === null) {
                return;
            }
            const conteudo = novoConteudo.trim();
            if (!conteudo) {
                showToast('Comentário não pode ficar vazio.', true);
                return;
            }

            const response = await api('/me/comentar', {
                method: 'PUT',
                body: {
                    historia_id: historiaId,
                    capitulo_id: capituloId,
                    comentario_id: comentarioId,
                    conteudo,
                },
            });

            const editado = response.comentario;
            if (editado) {
                state.capituloAtivo.capitulo.comentarios_recentes = (state.capituloAtivo.capitulo.comentarios_recentes || [])
                    .map((item) => item.id === comentarioId ? editado : item);
                renderModalLeitura();
            }
            showToast(response.mensagem || 'Comentário editado.');
            return;
        }

        if (action === 'delete-comment') {
            const confirmar = confirm('Deseja realmente excluir este comentário?');
            if (!confirmar) {
                return;
            }

            const response = await api('/me/comentar', {
                method: 'DELETE',
                body: {
                    historia_id: historiaId,
                    capitulo_id: capituloId,
                    comentario_id: comentarioId,
                },
            });

            state.capituloAtivo.capitulo.comentarios_recentes = (state.capituloAtivo.capitulo.comentarios_recentes || [])
                .filter((item) => item.id !== comentarioId);
            renderModalLeitura();
            showToast(response.mensagem || 'Comentário excluído.');
        }
    } catch (error) {
        handleError(error);
    }
}

async function atualizarDadosPosLeitura(historiaId) {
    const tarefas = [carregarPainel()];
    if (['inicio', 'historias'].includes(state.page)) {
        tarefas.push(carregarCatalogo());
    }
    if (state.page === 'biblioteca') {
        tarefas.push(carregarBiblioteca());
    }
    await Promise.all(tarefas);

    if (state.page === 'inicio') {
        renderInicio();
    }
    if (state.page === 'historias') {
        renderHistorias();
        if (state.historiaDetalhe?.id === historiaId) {
            await selecionarHistoria(historiaId);
        }
    }
    if (state.page === 'biblioteca') {
        renderBiblioteca();
    }
    if (state.page === 'voce') {
        renderVoce();
    }
}

async function encerrarSessao() {
    try {
        await api('/auth/logout', {
            method: 'POST',
            body: {token: state.token},
            auth: false,
        });
    } catch (error) {
        // Mesmo em erro de logout, seguimos com limpeza local da sessão.
    } finally {
        redirecionarLogin();
    }
}

async function enviarFotoPerfil(event) {
    event.preventDefault();
    const file = el.profilePhotoInput?.files?.[0];
    if (!file) {
        showToast('Selecione uma imagem para salvar no perfil.', true);
        return;
    }

    const tiposPermitidos = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!tiposPermitidos.has(file.type)) {
        showToast('Formato inválido. Use PNG, JPG ou WEBP.', true);
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        showToast('Imagem muito grande. Use até 2MB.', true);
        return;
    }

    try {
        const dataUrl = await lerArquivoComoDataURL(file);
        const response = await api('/me/perfil/foto', {
            method: 'POST',
            body: {foto_perfil: dataUrl},
        });
        if (response.conta) {
            state.user = {...(state.user || {}), ...response.conta};
            atualizarIdentidadeUI();
        }
        showToast(response.mensagem || 'Foto de perfil atualizada.');
    } catch (error) {
        handleError(error);
    }
}

async function removerFotoPerfil() {
    try {
        const response = await api('/me/perfil/foto', {
            method: 'POST',
            body: {foto_perfil: ''},
        });
        if (response.conta) {
            state.user = {...(state.user || {}), ...response.conta};
            atualizarIdentidadeUI();
        }
        if (el.profilePhotoInput) {
            el.profilePhotoInput.value = '';
        }
        showToast(response.mensagem || 'Foto removida.');
    } catch (error) {
        handleError(error);
    }
}

function atualizarIdentidadeUI() {
    if (el.headerUserName) {
        el.headerUserName.textContent = state.user?.nome || 'Usuário';
    }
    if (el.perfilNome) {
        el.perfilNome.textContent = state.user?.nome || 'Usuário';
    }
    if (el.perfilEmail) {
        el.perfilEmail.textContent = state.user?.email || '-';
    }
    atualizarAvatarUI();
}

function atualizarAvatarUI() {
    const foto = String(state.user?.foto_perfil || '').trim();
    const inicial = obterInicialNome(state.user?.nome);

    if (el.sidebarAvatarLetter) {
        el.sidebarAvatarLetter.textContent = foto ? '' : inicial;
    }
    if (el.profileAvatar) {
        el.profileAvatar.textContent = foto ? '' : inicial;
    }

    for (const avatar of [el.sidebarAvatar, el.profileAvatar]) {
        if (!avatar) {
            continue;
        }
        if (foto) {
            avatar.classList.add('has-photo');
            avatar.style.backgroundImage = `url(${foto})`;
        } else {
            avatar.classList.remove('has-photo');
            avatar.style.backgroundImage = 'none';
        }
    }

    if (el.profilePhotoRemove) {
        el.profilePhotoRemove.classList.toggle('hidden', !foto);
    }
}

function obterInicialNome(nome) {
    const texto = String(nome || '').trim();
    if (!texto) {
        return 'U';
    }
    return texto[0].toUpperCase();
}

function lerArquivoComoDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        reader.readAsDataURL(file);
    });
}

function normalizarCategoria(categoria) {
    const valor = String(categoria || '').trim().toLowerCase();
    const mapa = {
        lendo: 'lendo',
        favoritos: 'favoritos',
        pausados: 'pausados',
        concluidos: 'concluidos',
        'concluídos': 'concluidos',
    };
    return mapa[valor] || 'lendo';
}

function atualizarQueryHistoria(storyId) {
    if (state.page !== 'historias') {
        return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set('story', storyId);
    const query = params.toString();
    history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function redirecionarLogin() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/';
}

function handleError(error) {
    showToast(error.message || 'Ocorreu um erro inesperado.', true);
}

async function api(path, options = {}) {
    const method = options.method || 'GET';
    const query = options.query || null;
    const headers = {'Accept': 'application/json'};
    let url = `${API_BASE}${path}`;

    if (query) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                params.append(key, String(value));
            }
        });
        const queryText = params.toString();
        if (queryText) {
            url += `?${queryText}`;
        }
    }

    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    if (options.auth !== false) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.sucesso === false) {
        if (response.status === 401) {
            redirecionarLogin();
        }
        throw new Error(data.erro || 'Não foi possível concluir a operação.');
    }
    return data;
}

function showToast(message, error = false) {
    if (!el.toast) {
        return;
    }
    el.toast.textContent = message;
    el.toast.classList.remove('hidden', 'error');
    if (error) {
        el.toast.classList.add('error');
    }
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        el.toast.classList.add('hidden');
    }, 2800);
}

function corNomeUsuario(nome) {
    const texto = String(nome || 'usuario');
    let hash = 0;
    for (let i = 0; i < texto.length; i += 1) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 78% 70%)`;
}

function atualizarSeletorAvaliacao(nota, options = {}) {
    const preview = Boolean(options.preview);
    const valor = Math.max(1, Math.min(5, Number(nota || 1)));
    const range = document.getElementById('story-rating-range');
    const starsEl = document.getElementById('story-rating-stars');
    const valueEl = document.getElementById('story-rating-value');
    const starsPick = document.querySelectorAll('.hover-star');
    const hoverBox = document.getElementById('story-rating-hover');

    if (!preview && range) {
        range.value = String(valor);
    }
    if (starsEl) {
        starsEl.textContent = renderStarsText(valor);
    }
    if (valueEl) {
        valueEl.textContent = String(valor);
    }

    starsPick.forEach((elStar) => {
        const current = Number(elStar.dataset.hoverStar || 0);
        elStar.classList.toggle('is-active', current <= valor);
    });

    if (!preview && hoverBox) {
        hoverBox.dataset.ratingSelected = String(valor);
    }
}

function handleRatingHover(event) {
    const hoverStar = event.target.closest('[data-hover-star]');
    if (!hoverStar) {
        return;
    }
    const nota = Number(hoverStar.dataset.hoverStar || 1);
    atualizarSeletorAvaliacao(nota, {preview: true});
}

function handleRatingHoverOut(event) {
    const hoverBox = event.target.closest('#story-rating-hover');
    if (!hoverBox) {
        return;
    }
    if (event.relatedTarget && hoverBox.contains(event.relatedTarget)) {
        return;
    }
    const notaSelecionada = Number(hoverBox.dataset.ratingSelected || 5);
    atualizarSeletorAvaliacao(notaSelecionada);
}

function renderStarsText(nota) {
    const valor = Math.max(1, Math.min(5, Number(nota || 1)));
    return `${'★'.repeat(valor)}${'☆'.repeat(5 - valor)}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
    return escapeHtml(value);
}
