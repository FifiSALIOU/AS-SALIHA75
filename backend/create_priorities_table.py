"""
Script pour créer la table priorities et y insérer les 4 priorités de référence.
N'altère pas la table tickets ni aucune donnée existante.
Les tickets continuent d'utiliser la colonne priority (enum) comme avant.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER', 'tickets_user')}:"
    f"{os.getenv('POSTGRES_PASSWORD', 'password')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:"
    f"{os.getenv('POSTGRES_PORT', '5432')}/"
    f"{os.getenv('POSTGRES_DB', 'tickets_db')}"
)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Données des 4 priorités (codes alignés sur l'enum TicketPriority et couleurs actuelles de l'app)
PRIORITIES_DATA = [
    {"code": "critique", "label": "Critique", "color_hex": "#E53E3E", "background_hex": "rgba(229, 62, 62, 0.1)", "display_order": 1},
    {"code": "haute", "label": "Haute", "color_hex": "#F59E0B", "background_hex": "rgba(245, 158, 11, 0.1)", "display_order": 2},
    {"code": "moyenne", "label": "Moyenne", "color_hex": "#0DADDB", "background_hex": "rgba(13, 173, 219, 0.1)", "display_order": 3},
    {"code": "faible", "label": "Faible", "color_hex": "#6B7280", "background_hex": "#E5E7EB", "display_order": 4},
]


def create_priorities_table():
    db = Session()
    try:
        # Vérifier si la table existe déjà
        check_table = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'priorities'
            );
        """)
        table_exists = db.execute(check_table).scalar()

        if not table_exists:
            print("Création de la table 'priorities'...")
            db.execute(text("""
                CREATE TABLE priorities (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    label VARCHAR(100) NOT NULL,
                    color_hex VARCHAR(20),
                    background_hex VARCHAR(80),
                    display_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE
                );
            """))
            db.commit()
            print("OK - Table 'priorities' créée.")
        else:
            print("OK - La table 'priorities' existe déjà.")

        # Compter les lignes existantes
        count_query = text("SELECT COUNT(*) FROM priorities")
        count = db.execute(count_query).scalar()

        if count == 0:
            print("Insertion des 4 priorités de référence...")
            for p in PRIORITIES_DATA:
                db.execute(
                    text("""
                        INSERT INTO priorities (code, label, color_hex, background_hex, display_order, is_active)
                        VALUES (:code, :label, :color_hex, :background_hex, :display_order, TRUE)
                    """),
                    p
                )
            db.commit()
            print("OK - 4 priorités insérées (critique, haute, moyenne, faible).")
        else:
            print(f"OK - La table contient déjà {count} priorité(s), aucune insertion.")

        print("\nMigration terminée avec succès. Aucune donnée ticket n'a été modifiée.")

    except Exception as e:
        db.rollback()
        print(f"ERREUR lors de la migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_priorities_table()
