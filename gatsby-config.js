module.exports = {
  siteMetadata: {
    title: `Osinkoa vai palkkaa?`,
    url: "https://osinkoavaipalkkaa.fi",
    description: `Erityisesti freelancereille ja yksityisyrittäjille suunnattu "Osinkoa vai palkkaa" auttaa laskemaan optimimäärän palkkaa ja osinkoa suhteessa elinkustannuksiin ja veroihin`,
    author: ``,
    image: "/cover.jpg",
  },
  plugins: [
    "gatsby-plugin-typescript",
    "gatsby-plugin-tslint",
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `osinkoavaipalkkaa.fi`,
        short_name: `osinkoavaipalkkaa`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
