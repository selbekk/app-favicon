var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/xp/thymeleaf');

exports.responseFilter = function(req, res) {
    var siteConfig = portal.getSiteConfig();
    var imageId = siteConfig.favicon;
    if(
      !imageId ||
      (res.headers && res.headers.serverSideDisableFavicon)
    ) {
        return res;
    }

    if(res.headers && res.headers.serverSideDisableFavicon) {
        delete res.headers.serverSideDisableFavicon; // Strip serverSide data so the end user never receives them.
    }

    var view = resolve('favicon.html');
    var html = thymeleaf.render(view, { image: imageId });

    var headEnd = res.pageContributions.headEnd;
    if(!headEnd) {
        res.pageContributions.headEnd = [];
    }
    else if(typeof(headEnd) === 'string') {
        res.pageContributions.headEnd = [ headEnd ];
    }

    res.pageContributions.headEnd.push(html);

    return res;
}
