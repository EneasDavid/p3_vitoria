from typing import List, Dict
from collections import Counter

class SistemaRecomendacao:
    
    def __init__(self):
        self.historico_leituras: Dict['Usuario', List[str]] = {}  # usuario_id -> [generos_lidos]
    
    def analisar_historico(self, usuario: 'Usuario') -> Counter:
        generos_lidos = Counter()
        
        for capitulo in usuario.historico_leitura:
            if capitulo.historia:
                generos_lidos[capitulo.historia.genero] += 1
        
        return generos_lidos
    
    def recomendar(self, usuario: 'Usuario', catalogo: List['Historia'], 
                   limit: int = 5) -> List['Historia']:
        
        # 1. vai analisar preferências do usuário
        preferencias = self.analisar_historico(usuario)
        
        if not preferencias:
            # Se não tem histórico, recomenda histórias mais bem avaliadas
            return sorted(catalogo, key=lambda h: h.get_media_avaliacoes(), reverse=True)[:limit]
        
        # 2. vai obter gêneros preferidos
        generos_preferidos = [g for g, _ in preferencias.most_common(3)]
        
        # 3. vai filtrar histórias por gênero preferido, excluindo abandonadas e as já lidas
        historias_lidas_ids = {c.historia.id for c in usuario.historico_leitura if c.historia}
        
        recomendacoes = []
        for historia in catalogo:
            if (historia.genero in generos_preferidos and
                historia.id not in historias_lidas_ids and
                historia.status.value != "abandonada"):
                recomendacoes.append(historia)
        
        # 4. vai ordenar por avaliação e limita
        recomendacoes.sort(key=lambda h: h.get_media_avaliacoes(), reverse=True)
        
        return recomendacoes[:limit]
