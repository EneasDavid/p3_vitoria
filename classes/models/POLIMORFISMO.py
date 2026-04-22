# models/usuario.py (classe base)
class Usuario(ABC):
    @abstractmethod
    def get_tipo_usuario(self) -> str:
        """Cada subclasse implementa de forma diferente"""
        pass

# models/leitor.py (subclasse)
class Leitor(Usuario):
    def get_tipo_usuario(self) -> str:
        return "leitor"  # ← Comportamento específico

# models/autor.py (subclasse)
class Autor(Usuario):
    def get_tipo_usuario(self) -> str:
        return "autor"   # ← Comportamento específico

# Onde isso é usado (polimorfismo em ação):
# main.py - função polimórfica
def exibir_resumo(usuario: Usuario):
    """Aceita QUALQUER Usuario (Leitor OU Autor)"""
    print(f"Tipo: {usuario.get_tipo_usuario()}")  # ← POLIMORFISMO!
    # Se for Leitor → retorna "leitor"
    # Se for Autor → retorna "autor"

# Chamadas polimórficas
exibir_resumo(leitor1)  # Imprime: Tipo: leitor
exibir_resumo(autor1)   # Imprime: Tipo: autor


# Polimorfismo 2: Método get_acoes_permitidas()
# models/usuario.py
class Usuario(ABC):
    @abstractmethod
    def get_acoes_permitidas(self) -> List[str]:
        pass

# models/leitor.py
class Leitor(Usuario):
    def get_acoes_permitidas(self) -> List[str]:
        return ["ler", "avaliar", "comentar", "seguir"]  # Ações de leitor

# models/autor.py
class Autor(Usuario):
    def get_acoes_permitidas(self) -> List[str]:
        return ["publicar", "editar", "responder", "ver_estatisticas"]  # Ações de autor


# Polimorfismo 3: Método __str__()
# Cada classe tem sua própria representação em string
class Leitor(Usuario):
    def __str__(self) -> str:
        return f"📖 Leitor: {self.nome}"

class Autor(Usuario):
    def __str__(self) -> str:
        return f"✍️ Autor: {self.nome}"

# Uso polimórfico
usuarios = [leitor1, autor1]
for user in usuarios:
    print(user)  # ← POLIMORFISMO! Mesmo print, comportamentos diferentes

