module.exports = {
	transpileDependencies: ["vuetify", "vuex-composition-helpers"],
	lintOnSave: false,
	pluginOptions: {
		electronBuilder: {
			nodeIntegration: true,
		},
	},
};
