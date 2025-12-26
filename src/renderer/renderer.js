// HLS Video Initialization Function
function initializeHLSVideo(videoElement, streamUrl) {
  if (Hls.isSupported()) {
    const hls = new Hls({
      autoStartLoad: true,
      startPosition: -1,
      debug: false,
      enableWorker: true,
      lowLatencyMode: true
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(videoElement);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoElement.play().catch(err => {
        console.error('Autoplay prevented:', err);
        // Add visual indicator that user interaction is needed
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('Network error, trying to recover...');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Media error, trying to recover...');
            hls.recoverMediaError();
            break;
          default:
            console.error('Fatal error, cannot recover:', data);
            hls.destroy();
            break;
        }
      }
    });

    return hls;
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    videoElement.src = streamUrl;
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play().catch(err => {
        console.error('Autoplay prevented:', err);
      });
    });
    return null;
  } else {
    console.error('HLS is not supported in this browser');
    return null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Video Dashboard initialized');

  // Initialize Prague webcam (HLS)
  const pragueVideo = document.getElementById('video-1');
  if (pragueVideo) {
    // Prague webcam stream from skylinewebcams.com
    // Note: This URL might need updating when the session expires. To refresh:
    // 1. Visit https://www.skylinewebcams.com/en/webcam/czech-republic/prague/prague/prague.html
    // 2. Open DevTools (F12) → Network tab → Filter "m3u8"
    // 3. Refresh page and copy the full hd-auth.skylinewebcams.com URL
    const pragueStreamUrl = 'https://hd-auth.skylinewebcams.com/live.m3u8?a=untdjak3baquslofkf5tvp1v07';

    initializeHLSVideo(pragueVideo, pragueStreamUrl);
    console.log('Prague webcam initialized');
  }

  // Initialize YouTube live stream (HLS via yt-dlp)
  const youtubeVideo = document.getElementById('video-2');
  if (youtubeVideo) {
    // YouTube HLS stream extracted via yt-dlp
    // Note: This URL expires after a few hours. To refresh:
    // Run: yt-dlp -f 'best' -g 'https://www.youtube.com/watch?v=lWaDZ0E5xsw' 2>/dev/null
    // And update this URL
    const youtubeStreamUrl = 'https://manifest.googlevideo.com/api/manifest/hls_playlist/expire/1766793027/ei/48pOafDGGdyq0u8Px-y7-Q4/ip/185.76.9.50/id/lWaDZ0E5xsw.1/itag/96/source/yt_live_broadcast/requiressl/yes/ratebypass/yes/live/1/sgoap/gir%3Dyes%3Bitag%3D140/sgovp/gir%3Dyes%3Bitag%3D137/rqh/1/hls_chunk_host/rr1---sn-5goeenes.googlevideo.com/xpc/EgVo2aDSNQ%3D%3D/playlist_duration/30/manifest_duration/30/bui/AYUSA3AKJy2h-dGPn195JBNXiwGuZQRsG-LdGrbsHW7DSbxPbx366KNLVO_HBiYnLz1xY0amrjmNMs8t/spc/wH4Qq8zeja1c5ZQu1Hi-/vprv/1/playlist_type/DVR/cps/0/initcwndbps/2326250/met/1766771428,/mh/p-/mm/44/mn/sn-5goeenes/ms/lva/mv/m/mvi/1/pl/26/rms/lva,lva/dover/11/pacing/0/keepalive/yes/fexp/51552689,51565116,51565681,51580968/mt/1766771076/sparams/expire,ei,ip,id,itag,source,requiressl,ratebypass,live,sgoap,sgovp,rqh,xpc,playlist_duration,manifest_duration,bui,spc,vprv,playlist_type/sig/AJfQdSswRQIhANrS55lQo4MDixpEFrVP-DFiw7J5QFx2gogithYUmTLAAiB9nhHOzyWIdj6OviLP-ujsaq5p_4tw79usIP1GqlwZ4Q%3D%3D/lsparams/hls_chunk_host,cps,initcwndbps,met,mh,mm,mn,ms,mv,mvi,pl,rms/lsig/APaTxxMwRQIhANkUa9RNMPm_84HOFcYzRC2SeVJOZNqdhUoPnOMjBpeMAiAGrpr5jBYBVC2Eox1T2VZDe2vZ8TPHCn8S-3XZr_7CUA%3D%3D/playlist/index.m3u8';

    initializeHLSVideo(youtubeVideo, youtubeStreamUrl);
    console.log('YouTube live stream initialized');
  }

  // Initialize EarthTV stream
  const earthtvVideo = document.getElementById('video-3');
  if (earthtvVideo) {
    // EarthTV HLS stream
    const earthtvStreamUrl = 'https://livecdn-de-earthtv-com.global.ssl.fastly.net/edge0/cdnedge/HpL-X8UABqM/playlist.m3u8?token=EAIY6wE4p6eVeECIHUgF.CgdlYXJ0aHR2EAEyC0hwTC1YOFNBQnFJOgtIcEwtWDhVQUJxTQ.GR_kWLQufjppJjYUX_WI6iiZU9Lt2Dz0zpCBSrcZSLPRYlYFFUjYFakYM20FPAOw_VNJtRrFBQ3lSYbcL8NhYA&domain=www.earthtv.com';

    initializeHLSVideo(earthtvVideo, earthtvStreamUrl);
    console.log('EarthTV stream initialized');
  }

  // Initialize YouTube stream 2
  const youtube2Video = document.getElementById('video-4');
  if (youtube2Video) {
    // YouTube HLS stream extracted via yt-dlp
    // Note: This URL expires after a few hours. To refresh:
    // Run: yt-dlp -f 'best' -g 'https://www.youtube.com/live/0jUGiYZKAMg' 2>/dev/null
    const youtube2StreamUrl = 'https://manifest.googlevideo.com/api/manifest/hls_playlist/expire/1766794110/ei/Hs9Oac6pDfWSsfIPxPng0Q8/ip/71.202.61.240/id/0jUGiYZKAMg.2/itag/96/source/yt_live_broadcast/requiressl/yes/ratebypass/yes/live/1/sgoap/gir%3Dyes%3Bitag%3D140/sgovp/gir%3Dyes%3Bitag%3D137/rqh/1/hls_chunk_host/rr6---sn-bvvbaxivnuxqjvhj5nu-n4vl.googlevideo.com/xpc/EgVo2aDSNQ%3D%3D/playlist_duration/30/manifest_duration/30/bui/AYUSA3AX7iTFARBWziTRttf-Z4bqPrx4nlP76KvefOzbefiKOoDt2yzzIehohBsqI-nQyD4uh0ip_-Ht/spc/wH4QqwOXnLMeTrNUAq_y/vprv/1/playlist_type/DVR/cps/0/initcwndbps/4202500/met/1766772511,/mh/Oz/mm/44/mn/sn-bvvbaxivnuxqjvhj5nu-n4vl/ms/lva/mv/m/mvi/6/pl/22/rms/lva,lva/dover/11/pacing/0/keepalive/yes/fexp/51552689,51565115,51565681,51580968/mt/1766772274/sparams/expire,ei,ip,id,itag,source,requiressl,ratebypass,live,sgoap,sgovp,rqh,xpc,playlist_duration,manifest_duration,bui,spc,vprv,playlist_type/sig/AJfQdSswRQIhAOn2A8nE2BK8fgcAq_IUaMEk4xEtccm4nvVL1jPHKLruAiBmdf564lPRBGcz8bC-boDL-tSQ8hsnlra8L8AxpS8Pww%3D%3D/lsparams/hls_chunk_host,cps,initcwndbps,met,mh,mm,mn,ms,mv,mvi,pl,rms/lsig/APaTxxMwRQIgU69YHKqmL5l2AIMy2wIrEkX80DUp0JzerQXMMsTt0UQCIQCOsREyFm5tgaURikACLqRsAxH522mHl_oxQzR0CoOS-Q%3D%3D/playlist/index.m3u8';

    initializeHLSVideo(youtube2Video, youtube2StreamUrl);
    console.log('YouTube stream 2 initialized');
  }

  // Initialize YouTube stream 3
  const youtube3Video = document.getElementById('video-12');
  if (youtube3Video) {
    // YouTube HLS stream extracted via yt-dlp
    // Note: This URL expires after a few hours. To refresh:
    // Run: yt-dlp -f 'best' -g 'https://www.youtube.com/watch?v=046kfvReqT4' 2>/dev/null
    const youtube3StreamUrl = 'https://manifest.googlevideo.com/api/manifest/hls_playlist/expire/1766794215/ei/hs9OafC-OqmpsfIPmIy40Ak/ip/71.202.61.240/id/046kfvReqT4.1/itag/96/source/yt_live_broadcast/requiressl/yes/ratebypass/yes/live/1/sgoap/gir%3Dyes%3Bitag%3D140/sgovp/gir%3Dyes%3Bitag%3D137/rqh/1/hls_chunk_host/rr8---sn-bvvbaxivnuxqjvhj5nu-n4ve.googlevideo.com/xpc/EgVo2aDSNQ%3D%3D/playlist_duration/30/manifest_duration/30/bui/AYUSA3AY2WDNCqRaVyPKOiIo5oBadXYHOznU12w5DWXXBXgUmUlrcawX3y_BiJswV5IY5zsN9f5PedVG/spc/wH4Qqw0KtXuK4IE_0jkP/vprv/1/playlist_type/DVR/cps/4/initcwndbps/4206250/met/1766772615,/mh/kF/mm/44/mn/sn-bvvbaxivnuxqjvhj5nu-n4ve/ms/lva/mv/m/mvi/8/pl/22/rms/lva,lva/dover/11/pacing/0/keepalive/yes/fexp/51552689,51565115,51565682,51580968/mt/1766772274/sparams/expire,ei,ip,id,itag,source,requiressl,ratebypass,live,sgoap,sgovp,rqh,xpc,playlist_duration,manifest_duration,bui,spc,vprv,playlist_type/sig/AJfQdSswRQIhAKMuHPziUqu6x5R9GPqC9MP21gNR5xrIbnCDaQPBeAnaAiAZ2URUwQ871CsaTKX4ytWm8TYXbveFBN7hQIPT3kQw3Q%3D%3D/lsparams/hls_chunk_host,cps,initcwndbps,met,mh,mm,mn,ms,mv,mvi,pl,rms/lsig/APaTxxMwRAIgHceRZXf2ejsRpoOB8ljBXEr2eCPCLqXTtFXst187unUCIAphtiY_VhkyDTVf8VohEJ_09uqlBtLbBqydvGuwXXvn/playlist/index.m3u8';

    initializeHLSVideo(youtube3Video, youtube3StreamUrl);
    console.log('YouTube stream 3 initialized');
  }

  // Initialize YouTube stream 4
  const youtube4Video = document.getElementById('video-11');
  if (youtube4Video) {
    // YouTube HLS stream extracted via yt-dlp
    // Note: This URL expires after a few hours. To refresh:
    // Run: yt-dlp -f 'best' -g 'https://www.youtube.com/watch?v=BSWhGNXxT9A' 2>/dev/null
    const youtube4StreamUrl = 'https://manifest.googlevideo.com/api/manifest/hls_playlist/expire/1766794314/ei/6s9OaYeWH6OZsfIP2_ihqQo/ip/71.202.61.240/id/BSWhGNXxT9A.10/itag/96/source/yt_live_broadcast/requiressl/yes/ratebypass/yes/live/1/sgoap/gir%3Dyes%3Bitag%3D140/sgovp/gir%3Dyes%3Bitag%3D137/rqh/1/hls_chunk_host/rr2---sn-bvvbaxivnuxqjvhj5nu-n4vl.googlevideo.com/xpc/EgVo2aDSNQ%3D%3D/playlist_duration/30/manifest_duration/30/bui/AYUSA3Bz-Wj8VuGLYKgudjWRobXs4Yxuj_xOI2cThAhUEdubpVr4oqwOUAvn0PGPatm1mRJhvJQjKO4v/spc/wH4QqwEk8LZJcZpvp5XM/vprv/1/playlist_type/DVR/cps/9/initcwndbps/4202500/met/1766772715,/mh/m_/mm/44/mn/sn-bvvbaxivnuxqjvhj5nu-n4vl/ms/lva/mv/m/mvi/2/pl/22/rms/lva,lva/dover/11/pacing/0/keepalive/yes/fexp/51552689,51565115,51565682,51580968/mt/1766772274/sparams/expire,ei,ip,id,itag,source,requiressl,ratebypass,live,sgoap,sgovp,rqh,xpc,playlist_duration,manifest_duration,bui,spc,vprv,playlist_type/sig/AJfQdSswRAIgRQqM5MQ-X2Z-0Z9x44DlaXN643VNlW7VDBp24CA0QVMCIG8kIlCCYOjG4qZD9Twn5IMD_PAZPPCiGU0pTskOVi2U/lsparams/hls_chunk_host,cps,initcwndbps,met,mh,mm,mn,ms,mv,mvi,pl,rms/lsig/APaTxxMwRQIhAM9mpXPBeAJCcwMfibxe0HLo7PRQ1SqLenMXJO4llcvWAiB0SA7SgYCN8vCypu7iM5xG6jFgrbcQz9kiur4oAU8iXg%3D%3D/playlist/index.m3u8';

    initializeHLSVideo(youtube4Video, youtube4StreamUrl);
    console.log('YouTube stream 4 initialized');
  }

  // Initialize YouTube stream 5
  const youtube5Video = document.getElementById('video-10');
  if (youtube5Video) {
    // YouTube HLS stream extracted via yt-dlp
    // Note: This URL expires after a few hours. To refresh:
    // Run: yt-dlp -f 'best' -g 'https://www.youtube.com/watch?v=0aF8elLpiMo' 2>/dev/null
    const youtube5StreamUrl = 'https://manifest.googlevideo.com/api/manifest/hls_playlist/expire/1766794411/ei/S9BOad-7KoaRsfIPnseGuA8/ip/71.202.61.240/id/0aF8elLpiMo.1/itag/96/source/yt_live_broadcast/requiressl/yes/ratebypass/yes/live/1/sgoap/gir%3Dyes%3Bitag%3D140/sgovp/gir%3Dyes%3Bitag%3D137/rqh/1/hls_chunk_host/rr1---sn-bvvbaxivnuxqjvhj5nu-n4vd.googlevideo.com/xpc/EgVo2aDSNQ%3D%3D/playlist_duration/30/manifest_duration/30/bui/AYUSA3ATZ5IDPE3TA3eJPjK6Pl9x0iFQGAQ6lvUeByrfA8dRcj9mmydKj_xZV59vANq9r7mc5rfiAvp-/spc/wH4Qq1fFiydDVdV4tW99/vprv/1/playlist_type/DVR/cps/0/initcwndbps/4250000/met/1766772812,/mh/NH/mm/44/mn/sn-bvvbaxivnuxqjvhj5nu-n4vd/ms/lva/mv/m/mvi/1/pl/22/rms/lva,lva/dover/11/pacing/0/keepalive/yes/fexp/51552689,51565116,51565682,51580968/mt/1766772512/sparams/expire,ei,ip,id,itag,source,requiressl,ratebypass,live,sgoap,sgovp,rqh,xpc,playlist_duration,manifest_duration,bui,spc,vprv,playlist_type/sig/AJfQdSswRQIgEBwO20u0JPUMfOgzwSfJYeKSV9hD1jTpLP-YatTG8AECIQCHBSGje4RIyerC1Jk6p60soduuia1mWChn_Rqz8brVNA%3D%3D/lsparams/hls_chunk_host,cps,initcwndbps,met,mh,mm,mn,ms,mv,mvi,pl,rms/lsig/APaTxxMwRAIgQX1BGd5RTEhl-ChRk7eQA-i0vEAJQGz_werSwEJmFVwCIBP2PlVSQO-fYZuquPp4ppbhlzZAmQrThV_xfWPaWElP/playlist/index.m3u8';

    initializeHLSVideo(youtube5Video, youtube5StreamUrl);
    console.log('YouTube stream 5 initialized');
  }

  // Initialize YouTube stream 6
  const youtube6Video = document.getElementById('video-9');
  if (youtube6Video) {
    // YouTube HLS stream extracted via yt-dlp
    // Note: This URL expires after a few hours. To refresh:
    // Run: yt-dlp -f 'best' -g 'https://www.youtube.com/watch?v=CXYr04BWvmc' 2>/dev/null
    const youtube6StreamUrl = 'https://manifest.googlevideo.com/api/manifest/hls_playlist/expire/1766794466/ei/gtBOaejuH57XsfIPl7nnwQo/ip/71.202.61.240/id/CXYr04BWvmc.3/itag/95/source/yt_live_broadcast/requiressl/yes/ratebypass/yes/live/1/sgoap/gir%3Dyes%3Bitag%3D140/sgovp/gir%3Dyes%3Bitag%3D136/rqh/1/hls_chunk_host/rr14---sn-bvvbaxivnuxqjvhj5nu-n4vz.googlevideo.com/xpc/EgVo2aDSNQ%3D%3D/playlist_duration/30/manifest_duration/30/bui/AYUSA3CtCtPnrhS2AC0XQLVwxVc2BsUmHosPCrqxUYkzviquvz_ckP_OMYS1COgptk7ekdj6o1ItrNOZ/spc/wH4Qq_OuE33dIMkaquho/vprv/1/playlist_type/DVR/cps/129/initcwndbps/3975000/met/1766772867,/mh/gw/mm/44/mn/sn-bvvbaxivnuxqjvhj5nu-n4vz/ms/lva/mv/m/mvi/14/pl/22/rms/lva,lva/dover/11/pacing/0/keepalive/yes/fexp/51552689,51565115,51565681,51580968/mt/1766772512/sparams/expire,ei,ip,id,itag,source,requiressl,ratebypass,live,sgoap,sgovp,rqh,xpc,playlist_duration,manifest_duration,bui,spc,vprv,playlist_type/sig/AJfQdSswRQIgMuaDnFM86X4KZP1RCEZglnR64e0Qi8kJg8naC6-vyFACIQCUTV0P7f1I6HKQxhhKsGdEG70cuWAsCLyEannQdsa1dQ%3D%3D/lsparams/hls_chunk_host,cps,initcwndbps,met,mh,mm,mn,ms,mv,mvi,pl,rms/lsig/APaTxxMwRAIgNJiW_dClCguoOupf3xWivEbIKL0twlfR1NfthtdEF6MCIAEvTiv8wbAS4CbZJje0ZzH15XsV-A5KEu1p9uZtKGwi/playlist/index.m3u8';

    initializeHLSVideo(youtube6Video, youtube6StreamUrl);
    console.log('YouTube stream 6 initialized');
  }

  // Add visibility change handler to pause/resume videos when window is hidden
  document.addEventListener('visibilitychange', () => {
    const videos = document.querySelectorAll('video');
    if (document.hidden) {
      videos.forEach(v => v.pause());
    } else {
      videos.forEach(v => {
        v.play().catch(err => console.log('Resume play prevented:', err));
      });
    }
  });

  console.log('All video feeds initialized');
});
