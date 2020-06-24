##文档
#### 下载
```
wget -c https://ffmpeg.org/releases/ffmpeg-4.2.3.tar.bz2
```
#### 安装
```
tar -xvf ffmpeg-4.2.3.tar.bz2 && cd ffmpeg-4.2.3
[sudo] ./configure --disable-x86asm --enable-libmp3lame --enable-libx264 --enable-gpl --enable-nonfree --enable-openssl && [sudo] make -j8 && [sudo] make install

```

#### lame,mp3 encoder
```
wget https://nchc.dl.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz
tar -xvf lame-3.100.tar.gz && cd lame-3.100
sudo ./configure && sudo make && sudo make install
```

#### x264,mp4 encoder
```
wget https://code.videolan.org/videolan/x264/-/archive/stable/x264-stable.tar.gz && tar -xvf x264-stable.tar.gz  
sudo ./configure --enable-shared --disable-asm
sudo make && sudo make install

###
#export LD_LIBRARY_PATH="/usr/local/lib"
echo "/usr/local/lib" >> /etc/ld.so.conf
ldconfig
```
