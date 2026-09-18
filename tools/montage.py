import sys
from PIL import Image
ids=sys.argv[1:]
ims=[Image.open(f'pv_{i}.png') for i in ids]
# scale each to max 600px wide
sc=[]
for im in ims:
    r=min(1,700/im.width,700/im.height); sc.append(im.resize((int(im.width*r),int(im.height*r))))
cols=4; rows=(len(sc)+cols-1)//cols
W=max(i.width for i in sc); H=max(i.height for i in sc)
out=Image.new('RGB',(W*cols,H*rows),(16,26,51))
for n,im in enumerate(sc): out.paste(im,((n%cols)*W,(n//cols)*H))
out.save('montage.png'); print(out.size)
