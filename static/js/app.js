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
    capituloAtivo: null,
    readerPagination: {
        pages: [],
        currentPage: 0,
        wordsPerPage: 200,
    },
    readerPrefs: {
        fontFamily: 'serif_classic',
        fontSize: 19,
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
    el.storyCoverInput = document.getElementById('story-cover-input');
    el.capituloHistoriaId = document.getElementById('capitulo-historia-id');
    el.autoriaHistorias = document.getElementById('autoria-historias');

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
    el.readerBackdrop = document.getElementById('reader-modal-backdrop');
    el.readerClose = document.getElementById('reader-close');
    el.readerStoryName = document.getElementById('reader-story-name');
    el.readerChapterTitle = document.getElementById('reader-chapter-title');
    el.readerMeta = document.getElementById('reader-meta');
    el.readerContent = document.getElementById('reader-content');
    el.readerPrev = document.getElementById('reader-prev');
    el.readerNext = document.getElementById('reader-next');
    el.readerPagePrev = document.getElementById('reader-page-prev');
    el.readerPageNext = document.getElementById('reader-page-next');
    el.readerPageCounter = document.getElementById('reader-page-counter');
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
}

function bindGlobalEvents() {
    el.logout?.addEventListener('click', encerrarSessao);

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
    el.profilePhotoForm?.addEventListener('submit', enviarFotoPerfil);
    el.profilePhotoRemove?.addEventListener('click', removerFotoPerfil);

    el.readerBackdrop?.addEventListener('click', fecharLeitor);
    el.readerClose?.addEventListener('click', fecharLeitor);
    el.readerPrev?.addEventListener('click', async () => {
        const prev = state.capituloAtivo?.navegacao?.anterior_id;
        if (prev) {
            await abrirCapitulo(state.capituloAtivo.historia.id, prev);
        }
    });
    el.readerNext?.addEventListener('click', async () => {
        const next = state.capituloAtivo?.navegacao?.proximo_id;
        if (next) {
            await abrirCapitulo(state.capituloAtivo.historia.id, next);
        }
    });
    el.readerMark?.addEventListener('click', salvarProgressoLeitura);
    el.readerFinish?.addEventListener('click', () => salvarProgressoLeitura(100));
    el.readerPagePrev?.addEventListener('click', navegarPaginaAnterior);
    el.readerPageNext?.addEventListener('click', navegarProximaPagina);
    el.readerFontSize?.addEventListener('input', onReaderPreferenceChanged);
    el.readerFontOptions?.addEventListener('click', handleReaderPreferenceOptionClick);
    el.readerBgOptions?.addEventListener('click', handleReaderPreferenceOptionClick);
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
        <p class="meta-line">${story.total_capitulos} capítulos · nota ${Number(story.media_avaliacoes || 0).toFixed(1)}</p>
        ${typeof progresso === 'number' ? `<p class="muted">Seu progresso: ${progresso}%</p>` : ''}
        <div class="inline-actions">
            <button class="btn-primary" data-action="abrir-capitulo" data-story-id="${story.id}" data-chapter-id="${story.progresso_leitor?.capitulo_id || story.capitulo_inicial_id || ''}" type="button">Ler</button>
            <button class="btn-ghost" data-action="salvar-historia" data-story-id="${story.id}" data-categoria="favoritos" type="button">Favoritar</button>
        </div>
        <div class="rating-range-card">
            <label for="story-rating-range" class="muted">Sua avaliação</label>
            <div class="rating-range-head">
                <span id="story-rating-stars">${renderStarsText(5)}</span>
                <strong id="story-rating-value">5</strong>
            </div>
            <div id="story-rating-hover" class="rating-stars-hover" role="group" aria-label="Selecionar nota" data-rating-selected="5">
                ${[1, 2, 3, 4, 5].map((valor) => `
                    <span class="hover-star is-active" data-hover-star="${valor}" aria-hidden="true">★</span>
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
            <button class="btn-ghost" data-action="avaliar-historia-range" data-story-id="${story.id}" type="button">Enviar avaliação</button>
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
    atualizarSeletorAvaliacao(5);
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
                    ${historias.length ? historias.map((story) => `
                        <button class="list-button" data-action="abrir-historia" data-story-id="${story.id}" type="button">
                            <div>
                                <strong>${escapeHtml(story.titulo)}</strong>
                                <p class="muted">${escapeHtml(story.autor || 'Autor')}</p>
                            </div>
                            <span>Ver</span>
                        </button>
                    `).join('') : `<p class="placeholder">Sem histórias nesta categoria.</p>`}
                </div>
            </section>
        `;
    }).join('');

    const progresso = state.painel?.leitura?.progresso || [];
    el.bibliotecaProgresso.innerHTML = progresso.length
        ? progresso.map((item) => `
            <article class="compact-story">
                <div>
                    <strong>${escapeHtml(item.historia.titulo)}</strong>
                    <p class="muted">${escapeHtml(item.capitulo_titulo || 'Capítulo inicial')}</p>
                    <div class="progress"><span style="width:${item.percentual}%"></span></div>
                </div>
                <button class="btn-ghost" data-action="abrir-capitulo" data-story-id="${item.historia.id}" data-chapter-id="${item.capitulo_id || item.historia.capitulo_inicial_id || ''}" type="button">Continuar</button>
            </article>
        `).join('')
        : `<p class="placeholder">Você ainda não tem leituras em andamento.</p>`;
}

function renderEscrever() {
    if (!el.autoriaHistorias) {
        return;
    }
    el.autoriaHistorias.innerHTML = state.minhasHistorias.length
        ? state.minhasHistorias.map((story) => `
            <article class="story-row">
                <div>
                    <strong>${escapeHtml(story.titulo)}</strong>
                    <p class="muted">${escapeHtml(story.sinopse)}</p>
                    <p class="meta-line">${story.total_capitulos} capítulos · ${escapeHtml(story.genero || 'Geral')}</p>
                    <p class="muted">${(story.capitulos || []).map((chapter) => `${chapter.ordem}. ${chapter.titulo}`).join(' · ')}</p>
                </div>
                <button class="btn-ghost" data-action="abrir-historia" data-story-id="${story.id}" type="button">Ver no catálogo</button>
            </article>
        `).join('')
        : `<p class="placeholder">Você ainda não publicou nenhuma história.</p>`;

    if (el.capituloHistoriaId) {
        el.capituloHistoriaId.innerHTML = state.minhasHistorias.length
            ? state.minhasHistorias.map((story) => `<option value="${story.id}">${escapeHtml(story.titulo)}</option>`).join('')
            : `<option value="">Nenhuma história publicada</option>`;
        el.capituloHistoriaId.disabled = !state.minhasHistorias.length;
    }
}

function renderVoce() {
    if (!state.painel) {
        return;
    }
    const leitura = state.painel.leitura || {};
    const autoria = state.painel.autoria || {};

    if (el.voceStats) {
        el.voceStats.innerHTML = `
            <h3>Seu resumo</h3>
            <p class="muted">${escapeHtml(leitura.leitor?.painel || '')}</p>
            <div class="summary-cards compact">
                <div class="summary-item"><span>Leituras ativas</span><strong>${(leitura.progresso || []).length}</strong></div>
                <div class="summary-item"><span>Na biblioteca</span><strong>${leitura.biblioteca?.total || 0}</strong></div>
                <div class="summary-item"><span>Publicadas</span><strong>${autoria.total || 0}</strong></div>
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
    return `
        <article class="story-card">
            ${renderStoryCover(story)}
            <div class="story-body">
                <p class="chip">${escapeHtml(story.genero || 'Leitura')}</p>
                <h4>${escapeHtml(story.titulo)}</h4>
                <p class="muted">${escapeHtml(story.sinopse)}</p>
                <p class="meta-line">${escapeHtml(story.autor || 'Autor')} · ${story.total_capitulos} capítulos</p>
                <div class="inline-actions">
                    <button class="btn-ghost" data-action="selecionar-historia" data-story-id="${story.id}" type="button">Detalhes</button>
                    <button class="btn-primary" data-action="salvar-historia" data-story-id="${story.id}" data-categoria="lendo" type="button">Salvar</button>
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
    const hoverStar = event.target.closest('[data-hover-star]');
    if (hoverStar) {
        const nota = Number(hoverStar.dataset.hoverStar || 1);
        atualizarSeletorAvaliacao(nota);
        return;
    }

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

        const response = await api('/me/autoria/historias', {method: 'POST', body: payload});
        showToast(response.mensagem || 'História publicada com sucesso.');
        el.formNovaHistoria.reset();
        if (el.storyCoverInput) {
            el.storyCoverInput.value = '';
        }
        await carregarAutoria();
        renderEscrever();
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
        const response = await api(`/me/autoria/historias/${encodeURIComponent(payload.historia_id)}/capitulos`, {
            method: 'POST',
            body: {
                titulo: payload.titulo,
                conteudo: payload.conteudo,
            },
        });
        showToast(response.mensagem || 'Capítulo adicionado com sucesso.');
        el.formNovoCapitulo.reset();
        await carregarAutoria();
        renderEscrever();
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
    await carregarCatalogo();
    if (state.page === 'historias') {
        await selecionarHistoria(storyId);
        renderHistorias();
    }
}

async function abrirCapitulo(storyId, chapterId, options = {}) {
    const response = await api(`/me/historias/${encodeURIComponent(storyId)}/capitulos/${encodeURIComponent(chapterId)}`);
    const paginaInicial = options.paginaInicial || 'primeira';
    state.capituloAtivo = response;
    renderModalLeitura(paginaInicial);
    el.readerModal?.classList.remove('hidden');
    el.readerModal?.setAttribute('aria-hidden', 'false');
}

function renderModalLeitura(paginaInicial = 'manter') {
    if (!state.capituloAtivo) {
        return;
    }
    const {historia, capitulo, navegacao} = state.capituloAtivo;
    el.readerStoryName.textContent = `${historia.titulo} · ${historia.autor || 'Autor'}`;
    el.readerChapterTitle.textContent = capitulo.titulo;
    el.readerMeta.textContent = `Capítulo ${capitulo.ordem} · ${capitulo.tempo_estimado_minutos} min · ${capitulo.visualizacoes} leituras`;
    sincronizarControlesLeitor();
    aplicarPaginacaoCapitulo(paginaInicial);
    el.readerCommentsCount.textContent = String((capitulo.comentarios_recentes || []).length);
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

    el.readerPrev.disabled = !navegacao.anterior_id;
    el.readerNext.disabled = !navegacao.proximo_id;
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

    const blocos = dividirPaginaEmParagrafos(paginaAtual, 42);
    aplicarPreferenciasVisuaisLeitor();

    el.readerContent.innerHTML = `
        <div class="reader-pages">
            <article class="reader-page">
                ${blocos.length
                    ? blocos.map((paragrafo) => `<p>${escapeHtml(paragrafo)}</p>`).join('')
                    : '<p>Este capítulo ainda não possui conteúdo.</p>'}
                <footer class="reader-page-index">Página ${contadorLivro.paginaAtual}</footer>
            </article>
        </div>
    `;

    if (el.readerPageCounter) {
        el.readerPageCounter.textContent = `Página ${contadorLivro.paginaAtual} de ${contadorLivro.totalPaginas}`;
    }
    if (el.readerPagePrev) {
        el.readerPagePrev.disabled = !hasGlobalPrev;
    }
    if (el.readerPageNext) {
        el.readerPageNext.disabled = !hasGlobalNext;
    }
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
}

function fecharLeitor() {
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
