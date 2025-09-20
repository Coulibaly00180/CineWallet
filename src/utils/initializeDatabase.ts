import { db } from '@/db/client';
import { cinemas } from '@/db/schema';
import { defaultCinemas } from '@/utils/defaultCinemas';
import { eq } from 'drizzle-orm';

export async function initializeDefaultCinemas() {
  try {
    // Vérifier si des cinémas existent déjà
    const existingCinemas = await db.select().from(cinemas);

    if (existingCinemas.length === 0) {
      console.log('Aucun cinéma trouvé, initialisation avec les données par défaut...');

      // Insérer les cinémas par défaut
      for (const cinema of defaultCinemas) {
        await db.insert(cinemas).values({
          id: cinema.id,
          name: cinema.name,
          slug: cinema.slug,
          website: cinema.website || null,
          logoUri: cinema.logoUri || null,
          primaryColor: cinema.primaryColor,
          secondaryColor: cinema.secondaryColor,
          qrFormat: cinema.qrFormat || null,
          city: cinema.city || null,
          country: cinema.country,
          phone: cinema.phone || null,
          notes: cinema.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`${defaultCinemas.length} cinémas par défaut ajoutés à la base de données`);
    } else {
      console.log(`${existingCinemas.length} cinémas déjà présents dans la base de données`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des cinémas par défaut:', error);
  }
}

export async function resetCinemasToDefault() {
  try {
    // Supprimer tous les cinémas existants
    await db.delete(cinemas);

    // Réinsérer les cinémas par défaut
    await initializeDefaultCinemas();

    console.log('Base de données des cinémas réinitialisée avec les valeurs par défaut');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des cinémas:', error);
    throw error;
  }
}