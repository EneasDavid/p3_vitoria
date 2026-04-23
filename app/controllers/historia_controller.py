"""
Controllers para gerenciar histórias e experiências de leitura.
"""
import uuid
from app.models.historia import Historia
from app.models.capitulo import Capitulo
from app.models.avaliacao import Avaliacao, TipoAvaliacao
from app.models.autor import Autor
from app.models.leitor import Leitor
from app.controllers.usuario_controller import usuarios_db


# Armazenamento em memória (em produção seria um banco de dados)
historias_db = {}

TEMAS_GENERO = {
    'mistério': {'accent': '#6d597a', 'surface': '#f3ecf8'},
    'romance': {'accent': '#b56576', 'surface': '#fdf1f4'},
    'fantasia': {'accent': '#577590', 'surface': '#eef5fb'},
    'ficcao cientifica': {'accent': '#355070', 'surface': '#edf2fb'},
    'ficção científica': {'accent': '#355070', 'surface': '#edf2fb'},
    'drama': {'accent': '#7f5539', 'surface': '#f8efe8'},
    'aventura': {'accent': '#588157', 'surface': '#eef6ee'},
}


class HistoriaController:
    """Controller para gerenciamento de histórias."""

    @staticmethod
    def _limpar_texto(valor: str) -> str:
        """Normaliza campos textuais recebidos pela API."""
        return valor.strip() if isinstance(valor, str) else ""

    @staticmethod
    def _validar_capa(capa: str | None) -> tuple[bool, str | None, str | None]:
        """Valida o formato da capa e retorna (ok, capa_normalizada, erro)."""
        if capa is None:
            return True, None, None

        if not isinstance(capa, str):
            return False, None, 'Formato de capa inválido'

        capa_normalizada = capa.strip()
        if not capa_normalizada:
            return True, None, None

        if len(capa_normalizada) > 2_000_000:
            return False, None, 'Capa muito grande. Use até 2MB.'

        if not (
            capa_normalizada.startswith('data:image/')
            or capa_normalizada.startswith('https://')
            or capa_normalizada.startswith('http://')
        ):
            return False, None, 'Formato de capa inválido'

        return True, capa_normalizada, None

    @staticmethod
    def _obter_tema_visual(historia: Historia) -> dict:
        """Retorna uma paleta simples para destacar a história na interface."""
        genero = historia.genero.casefold()
        return TEMAS_GENERO.get(genero, {'accent': '#264653', 'surface': '#eef4f2'})

    @staticmethod
    def _buscar_capitulo(historia: Historia, capitulo_id: str) -> Capitulo | None:
        """Busca um capítulo por ID dentro da história."""
        for capitulo in historia.capitulos:
            if capitulo.id == capitulo_id:
                return capitulo
        return None

    @staticmethod
    def serializar_comentario(comentario) -> dict:
        """Converte um comentário para JSON."""
        return {
            'id': comentario.id,
            'usuario': comentario.usuario.nome,
            'usuario_id': comentario.usuario.id_usuario,
            'conteudo': comentario.obter_conteudo(),
            'curtidas': comentario.curtidas,
            'data_criacao': comentario.data_criacao.isoformat(),
        }

    @staticmethod
    def serializar_capitulo(capitulo: Capitulo, incluir_conteudo: bool = False) -> dict:
        """Converte um capítulo para JSON."""
        return {
            'id': capitulo.id,
            'titulo': capitulo.titulo,
            'ordem': capitulo.ordem,
            'total_palavras': capitulo.obter_total_palavras(),
            'visualizacoes': capitulo.visualizacoes,
            'comentarios': len(capitulo.comentarios),
            'media_avaliacoes': round(capitulo.obter_media_avaliacoes(), 1),
            'tempo_estimado_minutos': capitulo.obter_tempo_estimado_leitura(),
            'resumo': f"{capitulo.conteudo[:180]}..." if len(capitulo.conteudo) > 180 else capitulo.conteudo,
            'conteudo': capitulo.conteudo if incluir_conteudo else None,
            'data_atualizacao': capitulo.data_atualizacao.isoformat(),
        }

    @staticmethod
    def serializar_historia(historia: Historia, incluir_capitulos: bool = False, leitor_id: str | None = None) -> dict:
        """Converte uma história para JSON com dados voltados para leitura."""
        ultimo_capitulo = historia.obter_ultimo_capitulo()
        leitor = usuarios_db.get(leitor_id) if leitor_id else None
        progresso = leitor.obter_progresso(historia.id) if isinstance(leitor, Leitor) else None

        return {
            'id': historia.id,
            'titulo': historia.titulo,
            'sinopse': historia.sinopse,
            'genero': historia.genero,
            'capa': historia.capa,
            'status': historia.status,
            'autor': historia.autor.nome if historia.autor else None,
            'autor_id': historia.autor.id_usuario if historia.autor else None,
            'capitulos': [
                HistoriaController.serializar_capitulo(capitulo, incluir_conteudo=False)
                for capitulo in historia.capitulos
            ] if incluir_capitulos else None,
            'capitulo_inicial_id': historia.capitulos[0].id if historia.capitulos else None,
            'total_capitulos': historia.obter_quantidade_capitulos(),
            'leitores': len(historia.leitores),
            'media_avaliacoes': round(historia.obter_media_avaliacoes(), 1),
            'total_avaliacoes': len(historia.avaliacoes),
            'total_comentarios': historia.obter_total_comentarios(),
            'popularidade': round(historia.obter_popularidade(), 1),
            'tempo_estimado_minutos': historia.obter_tempo_estimado_leitura(),
            'ultimo_capitulo': {
                'id': ultimo_capitulo.id,
                'titulo': ultimo_capitulo.titulo,
                'ordem': ultimo_capitulo.ordem,
            } if ultimo_capitulo else None,
            'tema': HistoriaController._obter_tema_visual(historia),
            'progresso_leitor': progresso,
            'data_criacao': historia.data_criacao.isoformat(),
            'data_atualizacao': historia.data_atualizacao.isoformat(),
        }

    @staticmethod
    def criar_historia(titulo: str, sinopse: str, genero: str, usuario_id: str, capa: str | None = None) -> dict:
        """Cria uma nova história."""
        try:
            titulo = HistoriaController._limpar_texto(titulo)
            sinopse = HistoriaController._limpar_texto(sinopse)
            genero = HistoriaController._limpar_texto(genero)
            usuario_id = HistoriaController._limpar_texto(usuario_id)
            capa_ok, capa_normalizada, capa_erro = HistoriaController._validar_capa(capa)

            if not titulo:
                return {'sucesso': False, 'erro': 'Título é obrigatório', 'codigo': 400}
            if not sinopse:
                return {'sucesso': False, 'erro': 'Sinopse é obrigatória', 'codigo': 400}
            if not usuario_id:
                return {'sucesso': False, 'erro': 'Autor é obrigatório', 'codigo': 400}
            if not capa_ok:
                return {'sucesso': False, 'erro': capa_erro or 'Capa inválida', 'codigo': 400}

            autor = usuarios_db.get(usuario_id)
            if not autor:
                return {'sucesso': False, 'erro': 'Autor não encontrado', 'codigo': 404}
            if not isinstance(autor, Autor):
                return {
                    'sucesso': False,
                    'erro': 'Apenas usuários do tipo autor podem publicar histórias',
                    'codigo': 400,
                }

            historia = Historia(titulo, sinopse, genero, capa=capa_normalizada)
            autor.publicar_historia(historia)
            historias_db[historia.id] = historia
            return {
                'sucesso': True,
                'id': historia.id,
                'autor_id': autor.id_usuario,
                'mensagem': f'História "{titulo}" criada com sucesso!'
            }
        except Exception as e:
            return {'sucesso': False, 'erro': str(e), 'codigo': 500}

    @staticmethod
    def listar_historias(busca: str = '', genero: str = '', ordem: str = 'destaques', leitor_id: str | None = None) -> dict:
        """Lista histórias com filtros de descoberta."""
        busca = HistoriaController._limpar_texto(busca).casefold()
        genero = HistoriaController._limpar_texto(genero).casefold()
        ordem = HistoriaController._limpar_texto(ordem).casefold() or 'destaques'

        historias = list(historias_db.values())

        if busca:
            historias = [
                historia for historia in historias
                if busca in historia.titulo.casefold()
                or busca in historia.sinopse.casefold()
                or busca in historia.genero.casefold()
                or (historia.autor and busca in historia.autor.nome.casefold())
            ]

        if genero:
            historias = [
                historia for historia in historias
                if historia.genero.casefold() == genero
            ]

        if ordem == 'recentes':
            historias.sort(key=lambda historia: historia.data_atualizacao, reverse=True)
        elif ordem == 'bem_avaliadas':
            historias.sort(
                key=lambda historia: (
                    historia.obter_media_avaliacoes(),
                    len(historia.avaliacoes),
                    historia.obter_popularidade(),
                ),
                reverse=True,
            )
        elif ordem == 'maratona':
            historias.sort(key=lambda historia: historia.obter_tempo_estimado_leitura(), reverse=True)
        else:
            historias.sort(key=lambda historia: historia.obter_popularidade(), reverse=True)

        historias_lista = [
            HistoriaController.serializar_historia(historia, incluir_capitulos=False, leitor_id=leitor_id)
            for historia in historias
        ]

        generos = sorted({historia.genero for historia in historias_db.values() if historia.genero})

        return {
            'sucesso': True,
            'total': len(historias_lista),
            'historias': historias_lista,
            'filtros': {
                'busca': busca,
                'genero': genero,
                'ordem': ordem,
                'generos_disponiveis': generos,
            },
        }

    @staticmethod
    def listar_historias_por_autor(autor_id: str, leitor_id: str | None = None, incluir_capitulos: bool = True) -> dict:
        """Lista as histórias publicadas por um autor específico."""
        autor_id = HistoriaController._limpar_texto(autor_id)
        autor = usuarios_db.get(autor_id)
        if not autor:
            return {'sucesso': False, 'erro': 'Autor não encontrado', 'codigo': 404}
        if not isinstance(autor, Autor):
            return {'sucesso': False, 'erro': 'Usuário informado não é autor', 'codigo': 400}

        historias = [
            historia for historia in historias_db.values()
            if historia.autor and historia.autor.id_usuario == autor_id
        ]
        historias.sort(key=lambda historia: historia.data_atualizacao, reverse=True)

        return {
            'sucesso': True,
            'total': len(historias),
            'historias': [
                HistoriaController.serializar_historia(
                    historia,
                    incluir_capitulos=incluir_capitulos,
                    leitor_id=leitor_id,
                )
                for historia in historias
            ],
        }

    @staticmethod
    def obter_historia(historia_id: str, leitor_id: str | None = None) -> dict:
        """Obtém detalhes completos de uma história."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        return {
            'sucesso': True,
            'historia': HistoriaController.serializar_historia(
                historia,
                incluir_capitulos=True,
                leitor_id=leitor_id,
            )
        }

    @staticmethod
    def adicionar_capitulo(historia_id: str, titulo: str, conteudo: str) -> dict:
        """Adiciona um novo capítulo a uma história."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        try:
            titulo = HistoriaController._limpar_texto(titulo)
            conteudo = HistoriaController._limpar_texto(conteudo)

            if not titulo:
                return {'sucesso': False, 'erro': 'Título do capítulo é obrigatório', 'codigo': 400}
            if not conteudo:
                return {'sucesso': False, 'erro': 'Conteúdo do capítulo é obrigatório', 'codigo': 400}

            ordem = historia.obter_quantidade_capitulos() + 1
            capitulo = Capitulo(titulo, conteudo, ordem)
            historia.adicionar_capitulo(capitulo)
            return {
                'sucesso': True,
                'id': capitulo.id,
                'mensagem': f'Capítulo "{titulo}" adicionado com sucesso!'
            }
        except Exception as e:
            return {'sucesso': False, 'erro': str(e), 'codigo': 500}

    @staticmethod
    def avaliar_historia(historia_id: str, usuario_id: str, nota: int) -> dict:
        """Avalia uma história."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        try:
            usuario_id = HistoriaController._limpar_texto(usuario_id)
            if not usuario_id:
                return {'sucesso': False, 'erro': 'Usuário é obrigatório', 'codigo': 400}

            usuario = usuarios_db.get(usuario_id)
            if not usuario:
                return {'sucesso': False, 'erro': 'Usuário não encontrado', 'codigo': 404}

            try:
                nota = int(nota)
            except (TypeError, ValueError):
                return {'sucesso': False, 'erro': 'Nota deve ser um número inteiro', 'codigo': 400}

            if any(av.usuario and av.usuario.id_usuario == usuario_id for av in historia.avaliacoes):
                return {
                    'sucesso': False,
                    'erro': 'Este usuário já avaliou esta história',
                    'codigo': 409,
                }

            avaliacao = Avaliacao(
                id=str(uuid.uuid4()),
                usuario=usuario,
                nota=nota,
                tipo=TipoAvaliacao.HISTORIA
            )
            historia.adicionar_avaliacao(avaliacao)
            return {
                'sucesso': True,
                'media_atual': round(historia.obter_media_avaliacoes(), 1),
                'mensagem': 'Avaliação registrada com sucesso!'
            }
        except ValueError as e:
            return {'sucesso': False, 'erro': str(e), 'codigo': 400}
        except Exception as e:
            return {'sucesso': False, 'erro': str(e), 'codigo': 500}

    @staticmethod
    def obter_capitulos(historia_id: str) -> dict:
        """Lista todos os capítulos de uma história."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        capitulos_lista = [
            HistoriaController.serializar_capitulo(capitulo, incluir_conteudo=False)
            for capitulo in historia.capitulos
        ]

        return {
            'sucesso': True,
            'total': len(capitulos_lista),
            'capitulos': capitulos_lista
        }

    @staticmethod
    def obter_capitulo(historia_id: str, capitulo_id: str, usuario_id: str | None = None) -> dict:
        """Obtém os detalhes completos de um capítulo para leitura."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        capitulo = HistoriaController._buscar_capitulo(historia, capitulo_id)
        if not capitulo:
            return {'sucesso': False, 'erro': 'Capítulo não encontrado', 'codigo': 404}

        capitulo.registrar_visualizacao()

        usuario = usuarios_db.get(usuario_id) if usuario_id else None
        if usuario:
            historia.adicionar_leitor(usuario)

        indice_atual = historia.capitulos.index(capitulo)
        anterior = historia.capitulos[indice_atual - 1] if indice_atual > 0 else None
        proximo = historia.capitulos[indice_atual + 1] if indice_atual < len(historia.capitulos) - 1 else None

        return {
            'sucesso': True,
            'historia': {
                'id': historia.id,
                'titulo': historia.titulo,
                'autor': historia.autor.nome if historia.autor else None,
                'capitulos': [
                    {
                        'id': item.id,
                        'ordem': item.ordem,
                        'titulo': item.titulo,
                        'total_palavras': item.obter_total_palavras(),
                    }
                    for item in historia.capitulos
                ],
            },
            'capitulo': {
                **HistoriaController.serializar_capitulo(capitulo, incluir_conteudo=True),
                'comentarios_recentes': [
                    HistoriaController.serializar_comentario(comentario)
                    for comentario in capitulo.comentarios[-5:]
                ],
            },
            'navegacao': {
                'anterior_id': anterior.id if anterior else None,
                'proximo_id': proximo.id if proximo else None,
            }
        }

    @staticmethod
    def comentar_capitulo(historia_id: str, capitulo_id: str, usuario_id: str, conteudo: str) -> dict:
        """Adiciona um comentário a um capítulo."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        capitulo = HistoriaController._buscar_capitulo(historia, capitulo_id)
        if not capitulo:
            return {'sucesso': False, 'erro': 'Capítulo não encontrado', 'codigo': 404}

        usuario_id = HistoriaController._limpar_texto(usuario_id)
        conteudo = HistoriaController._limpar_texto(conteudo)
        if not usuario_id:
            return {'sucesso': False, 'erro': 'Leitor é obrigatório', 'codigo': 400}
        if not conteudo:
            return {'sucesso': False, 'erro': 'Comentário não pode estar vazio', 'codigo': 400}

        usuario = usuarios_db.get(usuario_id)
        if not isinstance(usuario, Leitor):
            return {'sucesso': False, 'erro': 'Apenas leitores podem comentar', 'codigo': 400}

        comentario = usuario.comentar(capitulo, conteudo)
        historia.adicionar_leitor(usuario)

        return {
            'sucesso': True,
            'comentario': HistoriaController.serializar_comentario(comentario),
            'mensagem': 'Comentário publicado com sucesso!'
        }

    @staticmethod
    def editar_comentario(
        historia_id: str,
        capitulo_id: str,
        comentario_id: str,
        usuario_id: str,
        conteudo: str,
    ) -> dict:
        """Edita um comentário existente de autoria do próprio usuário."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        capitulo = HistoriaController._buscar_capitulo(historia, capitulo_id)
        if not capitulo:
            return {'sucesso': False, 'erro': 'Capítulo não encontrado', 'codigo': 404}

        comentario_id = HistoriaController._limpar_texto(comentario_id)
        usuario_id = HistoriaController._limpar_texto(usuario_id)
        conteudo = HistoriaController._limpar_texto(conteudo)

        if not comentario_id:
            return {'sucesso': False, 'erro': 'Comentário é obrigatório', 'codigo': 400}
        if not usuario_id:
            return {'sucesso': False, 'erro': 'Leitor é obrigatório', 'codigo': 400}
        if not conteudo:
            return {'sucesso': False, 'erro': 'Comentário não pode estar vazio', 'codigo': 400}

        usuario = usuarios_db.get(usuario_id)
        if not isinstance(usuario, Leitor):
            return {'sucesso': False, 'erro': 'Apenas leitores podem editar comentários', 'codigo': 400}

        comentario = next((c for c in capitulo.comentarios if c.id == comentario_id), None)
        if not comentario:
            return {'sucesso': False, 'erro': 'Comentário não encontrado', 'codigo': 404}
        if not comentario.usuario or comentario.usuario.id_usuario != usuario_id:
            return {'sucesso': False, 'erro': 'Você só pode editar seus próprios comentários', 'codigo': 403}

        comentario.editar_conteudo(conteudo, usuario)
        return {
            'sucesso': True,
            'comentario': HistoriaController.serializar_comentario(comentario),
            'mensagem': 'Comentário editado com sucesso!',
        }

    @staticmethod
    def excluir_comentario(
        historia_id: str,
        capitulo_id: str,
        comentario_id: str,
        usuario_id: str,
    ) -> dict:
        """Exclui um comentário existente de autoria do próprio usuário."""
        historia = historias_db.get(historia_id)
        if not historia:
            return {'sucesso': False, 'erro': 'História não encontrada', 'codigo': 404}

        capitulo = HistoriaController._buscar_capitulo(historia, capitulo_id)
        if not capitulo:
            return {'sucesso': False, 'erro': 'Capítulo não encontrado', 'codigo': 404}

        comentario_id = HistoriaController._limpar_texto(comentario_id)
        usuario_id = HistoriaController._limpar_texto(usuario_id)

        if not comentario_id:
            return {'sucesso': False, 'erro': 'Comentário é obrigatório', 'codigo': 400}
        if not usuario_id:
            return {'sucesso': False, 'erro': 'Leitor é obrigatório', 'codigo': 400}

        usuario = usuarios_db.get(usuario_id)
        if not isinstance(usuario, Leitor):
            return {'sucesso': False, 'erro': 'Apenas leitores podem excluir comentários', 'codigo': 400}

        comentario = next((c for c in capitulo.comentarios if c.id == comentario_id), None)
        if not comentario:
            return {'sucesso': False, 'erro': 'Comentário não encontrado', 'codigo': 404}
        if not comentario.usuario or comentario.usuario.id_usuario != usuario_id:
            return {'sucesso': False, 'erro': 'Você só pode excluir seus próprios comentários', 'codigo': 403}

        capitulo.comentarios.remove(comentario)
        if comentario in usuario._comentarios:
            usuario._comentarios.remove(comentario)

        return {
            'sucesso': True,
            'comentario_id': comentario_id,
            'mensagem': 'Comentário excluído com sucesso!',
        }
