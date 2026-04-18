from models.leitor import Leitor
from models.autor import Autor
import uuid

class UsuarioFactory:
    "Factory para criação de usuários - encapsula a lógica de criação"
    
    @staticmethod
    def criar_leitor(nome: str, email: str, senha: str) -> Leitor:
        return Leitor(
            id=str(uuid.uuid4()),
            nome=nome,
            email=email,
            senha=senha
        )
    
    @staticmethod
    def criar_autor(nome: str, email: str, senha: str) -> Autor:
        return Autor(
            id=str(uuid.uuid4()),
            nome=nome,
            email=email,
            senha=senha
        )
