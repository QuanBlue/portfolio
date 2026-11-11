import type { APIRoute } from 'astro';
import { portfolioData, getCareerSettings } from '../../data/portfolio';

export const GET: APIRoute = async ({ url, redirect }) => {
  const career = getCareerSettings(portfolioData);
  const isAllowed = career.openToWork === true && Boolean(career.cvUrl);

  if (!isAllowed) {
    return new Response(
      JSON.stringify({
        status: 403,
        error: 'Forbidden',
        message: 'Curriculum Vitae access is currently restricted by the candidate.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }

  // If authorized, route to custom published CV URL or dedicated accessible viewer
  const targetUrl =
    career.cvUrl && !career.cvUrl.endsWith('/cv.pdf') && !career.cvUrl.endsWith('cv.pdf')
      ? career.cvUrl
      : '/cv';
  return redirect(targetUrl, 302);
};
