module.exports = {
  configureWebpack: {
    module: {
      rules: [
        { //上面的不修改，这是sass的配置
          test: /\.scss$/,
          exclude: '/node_modules/',
          use: [
            'style-loader',
            'css-loader',
            'sass-loader',
          ],
        }
      ]
    }
  }
  }