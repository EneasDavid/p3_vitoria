from typing import List
from models.usuario import Usuario
from models.historia import Historia

class PainelEstatisticas:
    
    def __init__(self):
        self.total_leitores = 0
        self.total_comentarios = 0
        self.capitulos_populares: List[str] = []
        self.tempo_medio_leitura_min = 0
    
    def atualizar(self, historia: 'Historia') -> None:
        self.total_leitores = len(historia.leitores)
        self.total_comentarios = sum(len(c.comentarios) for c in historia.capitulos)
        
        # vai calcular capítulos mais populares (por número de comentários)
        if historia.capitulos:
            self.capitulos_populares = sorted(
                historia.capitulos,
                key=lambda c: len(c.comentarios),
                reverse=True
            )[:3]
    
    def __str__(self) -> str:
        return f"Leitores: {self.total_leitores} | Comentários: {self.total_comentarios}"


class Autor(Usuario):
    
    def __init__(self, id: str, nome: str, email: str, senha: str):
        super().__init__(id, nome, email, senha)
        self.historias_publicadas: List[Historia] = []
        self.estatisticas = PainelEstatisticas()
    
    def publicar_historia(self, historia: 'Historia') -> None:
        self.historias_publicadas.append(historia)
        historia.autor = self
        print(f"História '{historia.titulo}' publicada por {self.nome}")
    
    def publicar_capitulo(self, historia: 'Historia', capitulo: 'Capitulo') -> None:
        if historia in self.historias_publicadas:
            historia.adicionar_capitulo(capitulo)
            #Pra notificar seguidores
            from models.notificacao import Notificacao
            for seguidor in self.autores_seguidos:
                if isinstance(seguidor, Usuario):
                    notif = Notificacao(
                        id=f"notif_{datetime.now().timestamp()}",
                        usuario=seguidor,
                        mensagem=f"Novo capítulo de '{historia.titulo}': {capitulo.titulo}",
                        tipo="NOVO_CAPITULO"
                    )
                    seguidor.adicionar_notificacao(notif)
            print(f"Capítulo '{capitulo.titulo}' publicado em '{historia.titulo}'")
    
    def atualizar_estatisticas(self) -> None:
        for historia in self.historias_publicadas:
            self.estatisticas.atualizar(historia)
    
    def __str__(self) -> str:
        return f"Autor({self.nome}, {len(self.historias_publicadas)} histórias)"
