var portal = require('/lib/xp/portal');
var cacheLib = require('/lib/cache');

// Sizes of images generated:
var sizes = [57, 60, 72, 76, 114, 120, 144, 152, 180]; // rel=apple-touch-icon
var altSizes = [16, 32, 96, 192]; // rel=icon
var imageTypes = {
  'png': 'image/png',
  'jpg': 'image/jpg',
  'gif': 'image/gif',
  'jpeg': 'image/jpeg',
  'svg': 'image/svg'
};

exports.responseProcessor = function (req, res) {
  var siteConfig = portal.getSiteConfig();
  var imageId = siteConfig.favicon;

  if (!imageId) {
    return res;
  }

  var headEnd = res.pageContributions.headEnd;
  if (!headEnd) {
    res.pageContributions.headEnd = [];
  } else if (typeof(headEnd) === 'string') {
    res.pageContributions.headEnd = [headEnd];
  }

  res.pageContributions.headEnd.push(createMetaLinks(siteConfig));

  return res;
};

function createMetaLinks(siteConfig) {
  var createImageUrl = getCreateImageFn(siteConfig.favicon);
  var cache = getCache(siteConfig).cache;
  return cache.get('favicon-image-generator-cache', function () {
    return [createMetaLink(64, 'shortcut icon', 'png')]
      .concat(sizes.map(function (size) {
        return createMetaLink(size, 'apple-touch-icon');
      }))
      .concat(altSizes.map(function (size) {
        return createMetaLink(size, 'icon', 'png');
      }))
      .join('\n');
  });

  function createMetaLink(size, rel, type) {
    var imageUrl = createImageUrl('square(' + size + ')', type);
    var mimeType = imageTypes[(type || 'jpg').toLowerCase()];
    var typeStr = mimeType ? 'type="' + mimeType + '"' : '';
    var sizes = 'sizes="' + size + 'x' + size + '" ';
    return '<link rel="' + (rel || 'icon') + '" ' + sizes + 'href="' + imageUrl + '" ' + typeStr + ' />';
  }
}

function getCreateImageFn(imageId) {
  return function (scale, format) {
    var siteConfig = portal.getSiteConfig();
    var urltype = siteConfig.urlType ? siteConfig.urlType : false;
    var url;
    var root;

    if(urltype == true){
      url = portal.imageUrl({
        id: imageId,
        scale: scale,
        format: format || 'jpg'
      });
      root = portal.pageUrl({
        path: portal.getSite()._path
      });
    } else {
      url = portal.imageUrl({
        id: imageId,
        scale: scale,
        format: format || 'jpg',
        type: 'absolute'
      });
      root = portal.pageUrl({
        path: portal.getSite()._path,
        type: 'absolute'
      });
    }
  
    var rootPart = root[root.length - 1] === '/' ? root.slice(0, -1) : root;
    return url.replace(/(.*)\/_\/image/, rootPart + '/_/image'); // Rewriting url to point to base-url of the app.
  };
}

var cacheObject = null;
function getCache(siteConfig) {
  if (!cacheObject || cacheObject.ttl !== siteConfig.ttl || siteConfig.favicon !== cacheObject.imageId || siteConfig.urlType !== cacheObject.urlType) {
    cacheObject = createCache(siteConfig.ttl, siteConfig.favicon, siteConfig.urlType);
  }
  return cacheObject;
}

function createCache(ttl, imageId, urlType) {
  return {
    ttl: ttl,
    imageId: imageId,
    urlType: urlType,
    cache: cacheLib.newCache({
      size: 100,
      expire: ttl || 300
    })
  };
}
