from datetime import datetime
from enum import Enum

class TipoNotificacao(Enum):
    NOVO_CAPITULO = "novo_capitulo"
    ATUALIZACAO_HISTORIA = "atualizacao_historia"
    COMENTARIO_RESPONDIDO = "comentario_respondido"

class Notificacao:
    
    def __init__(self, id: str, usuario: 'Usuario', mensagem: str, tipo: TipoNotificacao):
        self.id = id
        self.usuario = usuario
        self.mensagem = mensagem
        self.tipo = tipo
        self.data_envio = datetime.now()
        self.lida = False
    
    def marcar_como_lida(self) -> None:
        self.lida = True
    
    def __str__(self) -> str:
        status = "✓" if self.lida else "●"
        return f"[{status}] {self.mensagem}"
