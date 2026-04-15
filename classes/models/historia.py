from datetime import datetime, timedelta
from typing import List, Optional, Set
from enum import Enum

class StatusHistoria(Enum):
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    ABANDONADA = "abandonada"

class Historia:
    
    def __init__(self, id: str, titulo: str, descricao: str, genero: str):
        self.id = id
        self.titulo = titulo
        self.descricao = descricao
        self.genero = genero
        self.autor: Optional['Autor'] = None
        self.capitulos: List['Capitulo'] = []
        self.avaliacoes: List['Avaliacao'] = []
        self.status = StatusHistoria.EM_ANDAMENTO
        self.data_criacao = datetime.now()
        self.data_ultima_atualizacao = datetime.now()
        self.leitores: Set['Usuario'] = set()  # usuários que leram pelo menos 1 capítulo
    
    def adicionar_capitulo(self, capitulo: 'Capitulo') -> None:
        self.capitulos.append(capitulo)
        capitulo.historia = self
        self.data_ultima_atualizacao = datetime.now()
        self.verificar_status_abandono()  # vai atualizar status se necessário
    
    def adicionar_avaliacao(self, avaliacao: 'Avaliacao') -> None:
        self.avaliacoes.append(avaliacao)
    
    def get_media_avaliacoes(self) -> float:
        "Retorna a média das avaliações da história"
        if not self.avaliacoes:
            return 0.0
        return sum(a.nota for a in self.avaliacoes) / len(self.avaliacoes)
    
    def get_tempo_total_leitura_min(self) -> int:
        return sum(c.tempo_estimado_leitura_min for c in self.capitulos)
    
    def get_tempo_total_leitura_horas(self) -> float:
        "Retorna tempo total em horas"
        return self.get_tempo_total_leitura_min() / 60
    
    def verificar_status_abandono(self) -> None:
        """
        Verifica se a história está abandonada (3+ meses sem atualização)
        """
        if self.status == StatusHistoria.CONCLUIDA:
            return
        
        meses_sem_atualizacao = (datetime.now() - self.data_ultima_atualizacao).days / 30
        
        if meses_sem_atualizacao >= 3:
            self.status = StatusHistoria.ABANDONADA
        elif self.status == StatusHistoria.ABANDONADA and meses_sem_atualizacao < 3:
            self.status = StatusHistoria.EM_ANDAMENTO  # voltou a atualizar
    
    def marcar_como_concluida(self) -> None:
        self.status = StatusHistoria.CONCLUIDA
    
    def registrar_leitor(self, usuario: 'Usuario') -> None:
        self.leitores.add(usuario)
    
    def __str__(self) -> str:
        status_str = {
            StatusHistoria.EM_ANDAMENTO: "📖 Em andamento",
            StatusHistoria.CONCLUIDA: "✅ Concluída",
            StatusHistoria.ABANDONADA: "⚠️ Possivelmente abandonada"
        }
        return f"{self.titulo} ({status_str[self.status]}) - {self.genero}"
