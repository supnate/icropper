iCropper
========

iCropper is an image cropper implemented by pure javascript without any library dependency. It aims to be simple, fast, and easy to integrate.

DEMO: http://supnate.github.io/icropper/demo.html

Usage
=========
```js
var ic = new ICropper(
	'cropperContainer'    //Container id
	,{
		keepSquare: true    //Keep cropper area  square or rectangle
		,image: 'demo.png'
		,preview: [
				'previewSmall'  //Preview node id
		]
});
//use bindPreview to dynamically add preview nodes
ic.bindPreview('previewBig');
```

=======
Script released under the MIT license.
