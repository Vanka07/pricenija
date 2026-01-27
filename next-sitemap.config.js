/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://www.pricenija.com',
    generateRobotsTxt: false, // Using static robots.txt in /public instead
    generateIndexSitemap: false,
    changefreq: 'daily',
    priority: 0.7,
    sitemapSize: 5000,

    // Exclude admin and private routes from sitemap
    exclude: ['/admin/*', '/api/*'],
};
