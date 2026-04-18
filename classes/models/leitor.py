#USUÁRIO - SUBCLASSE : LEITOR
from typing import List, Optional
from models.usuario import Usuario
from models.biblioteca import Biblioteca
from models.avaliacao import Avaliacao, TipoAvaliacao
from models.comentario import Comentario
from models.capitulo import Capitulo
from models.historia import Historia

class Leitor(Usuario):
    """
    Leitor comum do StoryFlow - herda tudo de Usuario
    Especialização: foco em consumir conteúdo, avaliar e comentar
    """
    
    def __init__(self, id: str, nome: str, email: str, senha: str):
        # Chama o construtor da classe pai
        super().__init__(id, nome, email, senha)
        
        # Atributos específicos do Leitor
        self.biblioteca = Biblioteca(self)
        self.avaliacoes_feitas: List[Avaliacao] = []
        self.comentarios_feitos: List[Comentario] = []
    
    # IMPLEMENTAÇÃO DOS MÉTODOS ABSTRATOS 
    
    def get_tipo_usuario(self) -> str:
        return "leitor"
    
    def get_acoes_permitidas(self) -> List[str]:
        return [
            "ler_historias",
            "avaliar_capitulos",
            "avaliar_historias",
            "comentar",
            "seguir_autores",
            "organizar_biblioteca",
            "receber_recomendacoes"
        ]
    
    #  MÉTODOS ESPECÍFICOS DO LEITOR 
    
    def avaliar_capitulo(self, capitulo: Capitulo, nota: int) -> Avaliacao:
        from models.avaliacao import Avaliacao, TipoAvaliacao
        import uuid
        
        avaliacao = Avaliacao(
            id=str(uuid.uuid4()),
            usuario=self,
            nota=nota,
            tipo=TipoAvaliacao.CAPITULO,
            capitulo_id=capitulo.id
        )
        capitulo.adicionar_avaliacao(avaliacao)
        self.avaliacoes_feitas.append(avaliacao)
        print(f"⭐ {self.nome} avaliou o capítulo '{capitulo.titulo}' com {nota}/5")
        return avaliacao
    
    def avaliar_historia(self, historia: 'Historia', nota: int) -> Avaliacao:
        from models.avaliacao import Avaliacao, TipoAvaliacao
        import uuid
        
        avaliacao = Avaliacao(
            id=str(uuid.uuid4()),
            usuario=self,
            nota=nota,
            tipo=TipoAvaliacao.HISTORIA
        )
        historia.adicionar_avaliacao(avaliacao)
        self.avaliacoes_feitas.append(avaliacao)
        print(f"⭐ {self.nome} avaliou a história '{historia.titulo}' com {nota}/5")
        return avaliacao
    
    def comentar_capitulo(self, capitulo: Capitulo, conteudo: str, 
                          posicao_texto: Optional[int] = None) -> Comentario:
        import uuid
        
        comentario = Comentario(
            id=str(uuid.uuid4()),
            usuario=self,
            conteudo=conteudo,
            posicao_texto=posicao_texto
        )
        capitulo.adicionar_comentario(comentario)
        self.comentarios_feitos.append(comentario)
        print(f"💬 {self.nome} comentou em '{capitulo.titulo}': {conteudo[:50]}...")
        return comentario
    
    def adicionar_a_biblioteca(self, historia: 'Historia', categoria: str) -> None:
        from models.biblioteca import CategoriaBiblioteca
        categoria_map = {
            "lendo": CategoriaBiblioteca.LENDO,
            "favoritos": CategoriaBiblioteca.FAVORITOS,
            "para_ler_depois": CategoriaBiblioteca.PARA_LER_DEPOIS,
            "concluidos": CategoriaBiblioteca.CONCLUIDOS
        }
        self.biblioteca.adicionar_historia(historia, categoria_map.get(categoria))
    
    def marcar_progresso(self, historia: 'Historia', capitulo_numero: int, 
                         linha: int = 0) -> None:
        self.biblioteca.marcar_progresso(historia, capitulo_numero, linha)
    
    def get_continuar_lendo(self) -> List['Historia']:
        return self.biblioteca.get_continuar_lendo()
    
    def __str__(self) -> str:
        return f"📖 Leitor: {self.nome} | Segue {len(self.autores_seguidos)} autores | {len(self.biblioteca.get_continuar_lendo())} histórias em andamento"
