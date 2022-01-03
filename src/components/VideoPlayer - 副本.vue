<template>
  <div class="video-content">
    <div class="video-player">
      <!-- 播放器界面; 兼容ios  controls-->
      <video
        ref="video"
        webkit-playsinline="true"
        playsinline="true"
        x-webkit-airplay="true"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        x5-video-orientation="portraint"
        preload="auto"
        muted="true"
        :src="src"
        @playing="(state.playing = true)"
      >
        您的浏览器不支持HTML5
      </video>
      <!-- 控制窗口 -->
      <div
        class="control"
        @touchstart="touchEnterVideo"
        @touchend="touchLeaveVideo"
      >
        <!-- 播放 || 暂停 -->
        <div
          class="play"
          @touchstart.stop.prevent="clickPlayBtn"
          v-show="state.controlBtnShow && state.dragShow"
        >
          <img v-show="!state.playing" src="../assets/imgs/play.png" />
          <img v-show="state.playing" src="../assets/imgs/pause.png" />
        </div>
        <!-- 控制条 -->
        <div class="control-bar">
          <div
            class="durationTime"
            :style="{ visibility: state.controlBarShow ? 'visible' : 'hidden' }"
          >
            <span class="time">{{ video.displayTime }}</span
            >/
            <span class="total-time">{{ video.totalTime }}</span>
          </div>
          <span class="progress" ref="progress">
            <img
              class="progress-btn ignore"
              :style="{
                transform: `translate3d(${video.progress.current}px, 0, 0)`,
              }"
              src="../assets/imgs/dotted.png"
            />
            <span
              class="progress-loaded"
              :style="{ width: `${video.progress.current}px` }"
            ></span>
            <!-- 设置手动移动的进度条 -->
            <span
              class="progress-move"
              @touchmove.stop.prevent="moveIng($event)"
              @touchstart.stop="moveStart($event)"
              @touchend.stop="moveEnd($event)"
            ></span>
          </span>
        </div>
      </div>
    </div>
    <div class="video-btm" v-if="state.btmTxtShow">
      <img
        src="https://img0.baidu.com/it/u=3119542616,1165410720&fm=26&fmt=auto"
        alt="推荐图片"
        class="btmImg"
      />
      <div class="btmIntroduce">
        <h5>眼神我最流</h5>
        <div class="playNumb">
          <div class="collect">
            <img src="../assets/imgs/collected.png" alt="收藏" />
            <span class="num">1</span>
          </div>
          <div class="playNum">2881 人正在玩</div>
        </div>
        <span class="btmTxt">益智</span>
      </div>
      <div class="btmOPen" @click.stop.prevent="openUrl">打开</div>
    </div>
  </div>
</template>
<script>
import { throttle, timeParse } from "../tools/tool";
export default {
  name: "VideoPlayer",
  data() {
    return {
      src: "https://www.runoob.com/try/demo_source/movie.mp4",
      // video元素
      $video: null,
      // 视频容器元素
      player: {
        $player: null,
        pos: null,
      },
      // progress进度条元素
      progressBar: {
        $progress: null, // 进度条DOM对象
        pos: null,
      },
      // video控制显示设置
      video: {
        loaded: 0, // 缓存长度
        displayTime: "00:00", // 进度时间
        totalTime: "00:00", // 总时间
        progress: {
          width: 0, // 进度条长度
          current: 0, // 进度条当前位置
        },
      },
      // 定时器
      hideTimer: null,
      // 播放状态控制
      state: {
        controlBtnShow: true, // 播放按钮
        controlBarShow: false, // 控制条-时间
        playing: false,
        btmTxtShow: true,
        dragShow: true
      },
      // 首次触摸
      isFirstTouch: true,
      // 暂停状态触摸
      isPauseTouch: false,
    };
  },

  methods: {
    init() {
      // 初始化video,获取video元素
      this.$video = this.$el.getElementsByTagName("video")[0];
      this.initPlayer();
    },
    // 初始化播放器容器, 获取video-player元素
    // getBoundingClientRect()以client可视区的左上角为基点进行位置计算
    initPlayer() {
      const $player = this.$el;
      const $progress = this.$el.getElementsByClassName("progress")[0];
      // 播放器位置
      this.player.$player = $player;
      this.progressBar.$progress = $progress;
      this.player.pos = $player.getBoundingClientRect();
      this.progressBar.pos = $progress.getBoundingClientRect();
      this.video.progress.width = Math.round(
        $progress.getBoundingClientRect().width
      );
    },
    // 点击播放 & 暂停按钮
    clickPlayBtn() {
      this.isFirstTouch = false;
      this.state.playing = !this.state.playing;
      if (this.$video) {
        // 播放状态
        if (this.state.playing) {
          try {
            this.$video.play();
            this.isPauseTouch = false;
            // 监听缓存进度
            this.$video.addEventListener("progress", () => {
              this.getLoadTime();
            });
            // 监听播放进度
            this.$video.addEventListener(
              "timeupdate",
              throttle(this.getPlayTime, 10, 1)
            );
            // 监听结束
            this.$video.addEventListener("ended", () => {
              // 重置状态
              this.state.playing = false;
              this.state.controlBtnShow = true;
              this.state.btmTxtShow = true;
              this.video.displayTime = "00:00";
              this.video.progress.current = 0;
              this.$video.currentTime = 0;
            });
          } catch (e) {
            // 捕获url异常出现的错误
          }
        } else { // 停止状态
          this.$video.pause();
          this.isPauseTouch = true;
          this.state.btmTxtShow = false;
        }
      }
    },
    // 触碰播放区
    touchEnterVideo() {
      if (this.isFirstTouch) return;
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      this.state.controlBtnShow = true;
      this.state.dragShow = false;
    },
    // 离开播放区
    touchLeaveVideo() {
      if (this.isFirstTouch) return;
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
      }
      // 暂停触摸, 不隐藏
      if (this.isPauseTouch && !this.state.playing) {
        this.state.controlBtnShow = true;
      } else {
        this.hideTimer = setTimeout(() => {
          // 加载中只显示loading
          if(this.state.playing) {
            this.state.controlBtnShow = false;
          }
          this.hideTimer = null;
        }, 2000);
      }
      this.state.dragShow = true;
    },
    // 获取播放时间
    getPlayTime() {
      const percent = this.$video.currentTime / this.$video.duration;
      this.video.progress.current = Math.round(
        this.video.progress.width * percent
      );
      // 赋值时长
      this.video.totalTime = timeParse(this.$video.duration);
      this.video.displayTime = timeParse(this.$video.currentTime);
    },
    // 获取缓存时间
    getLoadTime() {
      // console.log('缓存了...',this.$video.buffered.end(0));
      this.video.loaded =
        (this.$video.buffered.end(0) / this.$video.duration) * 100;
    },
    // 手动调节播放进度
    moveStart() {},
    moveIng(e) {
      console.log("触摸中...");
      this.state.controlBarShow = true;
      this.state.controlBtnShow = false;
      let currentX = e.targetTouches[0].pageX;
      let offsetX = currentX - this.progressBar.pos.left;
      // 边界检测
      if (offsetX <= 0) {
        offsetX = 0;
      }
      if (offsetX >= this.video.progress.width) {
        offsetX = this.video.progress.width;
      }
      this.video.progress.current = offsetX;

      let percent = this.video.progress.current / this.video.progress.width;
      this.$video.duration && this.setPlayTime(percent, this.$video.duration);
    },
    moveEnd(e) {
      this.state.controlBarShow = false;
      if(this.state.playing) {
        this.state.controlBtnShow = false;
      } else {
        this.state.controlBtnShow = true;
      }
      // console.log("触摸结束...");
      let currentX = e.changedTouches[0].pageX;
      let offsetX = currentX - this.progressBar.pos.left;
      this.video.progress.current = offsetX;
      // 这里的offsetX都是正数
      let percent = offsetX / this.video.progress.width;
      this.$video.duration && this.setPlayTime(percent, this.$video.duration);
    },
    // 设置手动播放时间
    setPlayTime(percent, totalTime) {
      this.$video.currentTime = Math.floor(percent * totalTime);
    },
    openUrl() {
      location.href = "baidu.com";
    }
  },
  mounted() {
    setTimeout(() => {
      this.init();
    }, 20);
  },
  beforeDestroy() {}
};
</script>
<style lang='scss' scoped>
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.video-content {
  .video-player {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    position: relative;
    video {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
    // 控制层
    .control {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background-color: transparent;
      .play {
          width: 100%;
          height: 100%;
        img {
          width: 58px;
          height: 58px;
          position: absolute;
          left: 50%;
          top: 80%;
          transform: translate(-50%, -50%);
          z-index: 101;
        }
      }
      &-bar {
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        height: 26px;
        display: flex;
        align-items: center;
        .durationTime {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          span {
            font-size: 16px;
            color: #fff;
            font-weight: 500;
            white-space: nowrap;
          }
        }
        .progress {
          position: relative;
          margin: 0 8px;
          width: 350px;
          height: 4px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 2px;
          .progress-move {
            width: 100%;
            height: 26px;
            position: absolute;
            z-index: 100;
            left: 0;
            top: 0;
            transform: translateY(-50%);
            background-color: transparent;
          }
          .progress-btn {
            position: absolute;
            left: -14px;
            top: -16px;
            transition: all 16ms;
          }
          // 不会被转义
          .ignore {
            width: 36px;
            height: 36px;
          }
          .progress-loaded {
            background-color: red;
            position: absolute;
            left: 0;
            top: 0;
            width: 0;
            height: 100%;
            border-radius: 2px;
            transition: all 16ms;
          }
        }
      }
    }
  }
  .video-btm {
    position: fixed;
    bottom: 120px;
    width: 90%;
    height: 70px;
    left: 5%;
    display: flex;
    .btmImg {
      width: 70px;
      height: 70px;
      border-radius: 10px;
    }
    .btmIntroduce {
      color: #fff;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin-left: 10px;
      text-align: left;
      .playNumb {
        display: flex;
        .collect {
          color: yellow;
          img {
            display: inline-block;
            width: 20px;
            height: 20px;
          }
        }
        .playNum {
          opacity: 0.5;
          margin-left: 20px;
        }
      }
      .btmTxt {
        opacity: 0.5;
      }
    }
    .btmOPen {
      background-color: red;
      width: 70px;
      height: 40px;
      line-height: 40px;
      border-radius: 20px;
      z-index: 999;
      text-align: center;
      color: #fff;
    }
  }
}
</style>