"""
Script pour creer les 5 utilisateurs personnalises
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Role
from app.security import get_password_hash

def create_users():
    db = SessionLocal()
    
    try:
        # Recuperer les roles
        role_utilisateur = db.query(Role).filter(Role.name == "Utilisateur").first()
        role_dsi = db.query(Role).filter(Role.name == "DSI").first()
        role_adjoint = db.query(Role).filter(Role.name == "Adjoint DSI").first()
        role_technicien = db.query(Role).filter(Role.name == "Technicien").first()
        
        if not all([role_utilisateur, role_dsi, role_adjoint, role_technicien]):
            print("ERREUR: Un ou plusieurs roles sont manquants!")
            return
        
        # Liste des utilisateurs a creer
        users_to_create = [
            {
                "username": "fatougueye",
                "password": "fatou123",
                "full_name": "Fatou Gueye",
                "email": "fatougueye@company.com",
                "role": role_utilisateur,
                "description": "Utilisateur qui cree des tickets"
            },
            {
                "username": "biranengom",
                "password": "biranengom123",
                "full_name": "Birane Ngom",
                "email": "biranengom@company.com",
                "role": role_dsi,
                "description": "DSI qui delegue a son adjoint ou assigne au technicien"
            },
            {
                "username": "amethfall",
                "password": "amethfall123",
                "full_name": "Ame Thfall",
                "email": "amethfall@company.com",
                "role": role_adjoint,
                "description": "Adjoint DSI qui assigne aux techniciens"
            },
            {
                "username": "wane",
                "password": "wane123",
                "full_name": "Wane",
                "email": "wane@company.com",
                "role": role_technicien,
                "specialization": "materiel",
                "description": "Technicien materiel"
            },
            {
                "username": "backary",
                "password": "backary123",
                "full_name": "Backary",
                "email": "backary@company.com",
                "role": role_technicien,
                "specialization": "applicatif",
                "description": "Technicien applicatif"
            }
        ]
        
        print("Creation des utilisateurs personnalises...")
        print("-" * 50)
        
        for user_data in users_to_create:
            # Verifier si l'utilisateur existe deja
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if existing_user:
                print(f"SKIP - L'utilisateur {user_data['username']} existe deja")
                continue
            
            # Creer l'utilisateur
            new_user = User(
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                email=user_data["email"],
                role_id=user_data["role"].id,
                actif=True,
                specialization=user_data.get("specialization")
            )
            
            db.add(new_user)
            db.commit()
            
            print(f"OK - Utilisateur cree: {user_data['username']} ({user_data['description']})")
            print(f"     Role: {user_data['role'].name}")
            if user_data.get("specialization"):
                print(f"     Specialisation: {user_data['specialization']}")
        
        print("-" * 50)
        print("Tous les utilisateurs ont ete crees avec succes!")
        print()
        print("Resume des comptes:")
        print("  1. fatougueye / fatou123 - Utilisateur (cree des tickets)")
        print("  2. biranengom / biranengom123 - DSI (delegue ou assigne)")
        print("  3. amethfall / amethfall123 - Adjoint DSI (assigne aux techniciens)")
        print("  4. wane / wane123 - Technicien materiel")
        print("  5. backary / backary123 - Technicien applicatif")
        
    except Exception as e:
        print(f"ERREUR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_users()


