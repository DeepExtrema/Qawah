# Editorial images

Non-product artwork, referenced from [`frontend/lib/media.js`](../../lib/media.js).

| File | Used by | Rendered at |
| --- | --- | --- |
| `qahwa-ibrik.png` | Learn page recipe card | 120 x 78 |
| `subscription.png` | Home page subscription promo | 88 x 70 |
| `wholesale.png` | Home page wholesale promo | 88 x 70 |

Filenames must match exactly, since `media.js` refers to them by path.

A missing file is not fatal: `ProductImage` catches the load error and renders
its placeholder instead, so the page stays intact until the artwork exists.

## Before committing a new image

Resize to about 900 px on the long edge, matching the product photography:

```bash
python -c "
from PIL import Image
import sys, os
f = sys.argv[1]
im = Image.open(f).convert('RGB')
w = 900 if im.width >= im.height else round(im.width * 900 / im.height)
h = round(im.height * w / im.width)
im.resize((w, h), Image.LANCZOS).save(f, 'PNG', optimize=True)
print(f, os.path.getsize(f) // 1024, 'KB')
" frontend/public/editorial/qahwa-ibrik.png
```

Straight from an image generator these are several megabytes each, which is
bandwidth every visitor pays for on a thumbnail a hundred pixels wide.
