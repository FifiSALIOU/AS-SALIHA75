"""
Migration : ajoute la colonne priority_id à la table tickets et remplit à partir de priority.
- N'altère pas la colonne priority (elle reste en place, aucune donnée perdue).
- Ajoute priority_id (clé étrangère vers priorities), remplit avec l'id correspondant au code de priority.
À exécuter après create_priorities_table.py (la table priorities doit exister et contenir les 4 priorités).
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


def migrate_priority_id():
    db = Session()
    try:
        # 1) Vérifier si la colonne priority_id existe déjà
        check_column = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'priority_id';
        """)
        col_exists = db.execute(check_column).fetchone()

        if col_exists:
            print("OK - La colonne 'priority_id' existe déjà dans 'tickets'.")
        else:
            print("Ajout de la colonne 'priority_id' à la table 'tickets'...")
            db.execute(text("""
                ALTER TABLE tickets
                ADD COLUMN priority_id INTEGER REFERENCES priorities(id);
            """))
            db.commit()
            print("OK - Colonne 'priority_id' ajoutée.")

        # 2) Remplir priority_id à partir de priority (enum → code texte → id dans priorities)
        # En PostgreSQL, on caste l'enum en text pour faire la jointure avec priorities.code
        print("Remplissage de priority_id à partir des valeurs de priority...")
        update_result = db.execute(text("""
            UPDATE tickets t
            SET priority_id = p.id
            FROM priorities p
            WHERE p.code = t.priority::text
            AND t.priority_id IS NULL;
        """))
        db.commit()
        updated = update_result.rowcount
        print(f"OK - {updated} ligne(s) mise(s) à jour.")

        # 3) Vérifier qu'aucun ticket n'a priority_id NULL (tous doivent avoir une priorité connue)
        null_count = db.execute(text("SELECT COUNT(*) FROM tickets WHERE priority_id IS NULL")).scalar()
        if null_count > 0:
            print(f"ATTENTION - {null_count} ticket(s) ont encore priority_id NULL (priorité non trouvée dans la table priorities).")
        else:
            print("OK - Tous les tickets ont un priority_id renseigné.")

        # 4) Ne pas supprimer la colonne priority : elle reste pour le fonctionnement actuel de l'application.
        print("\nMigration terminée. La colonne 'priority' n'a pas été modifiée ni supprimée.")
        print("Aucune donnée n'a été perdue.")

    except Exception as e:
        db.rollback()
        print(f"ERREUR lors de la migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_priority_id()
