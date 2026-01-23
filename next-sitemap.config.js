/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://www.pricenija.com',
    generateRobotsTxt: true,
    generateIndexSitemap: false,
    changefreq: 'daily',
    priority: 0.7,
    sitemapSize: 5000,

    // Exclude admin and private routes from sitemap
    exclude: ['/admin/*', '/api/*'],

    robotsTxtOptions: {
          policies: [
            {
                      userAgent: '*',
                      allow: '/',
                      disallow: ['/admin', '/api'],
            },
                ],
          additionalSitemaps: [
                  'https://www.pricenija.com/sitemap.xml',
                ],
    },
};
