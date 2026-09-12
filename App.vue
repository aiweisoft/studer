<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 全局样式重置 */
	page {
		background-color: #f5f7fa;
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
		box-sizing: border-box;
	}

	button {
		border: none;
		padding: 0;
		margin: 0;
		line-height: 1.5;
	}

	button::after {
		border: none;
	}

	image {
		will-change: transform;
	}

	input {
		background: transparent;
	}
</style>
