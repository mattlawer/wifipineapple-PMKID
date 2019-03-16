registerController('PMKID_Controller', ['$api', '$scope', '$rootScope', '$interval', '$timeout', function ($api, $scope, $rootScope, $interval, $timeout) {
	$scope.title = "Loading...";
	$scope.version = "Loading...";

	$scope.refreshInfo = (function () {
		$api.request({
			module: 'PMKID',
			action: "refreshInfo"
		}, function (response) {
			$scope.title = response.title;
			$scope.version = "v" + response.version;
		})
	});

	$scope.refreshInfo();

}]);

registerController('PMKID_ControlsController', ['$api', '$scope', '$rootScope', '$interval', '$timeout', function ($api, $scope, $rootScope, $interval, $timeout) {
	$scope.status = "Loading...";
	$scope.statusLabel = "default";
	$scope.starting = false;

	$scope.install = "Loading...";
	$scope.installLabel = "default";
	$scope.processing = false;

	$scope.bootLabelON = "default";
	$scope.bootLabelOFF = "default";

	$scope.monitors = [];
	$scope.selectedMonitor = '';

	$scope.saveSettingsLabel = "default";

	$scope.device = '';
	$scope.sdAvailable = false;

	$rootScope.status = {
		installed: false,
		refreshOutput: false,
		refreshCaptures: false
	};

	$scope.refreshStatus = (function () {
		$api.request({
			module: "PMKID",
			action: "refreshStatus"
		}, function (response) {
			$scope.status = response.status;
			$scope.statusLabel = response.statusLabel;

			$rootScope.status.installed = response.installed;
			$scope.device = response.device;
			$scope.sdAvailable = response.sdAvailable;
			if (response.processing) $scope.processing = true;
			$scope.install = response.install;
			$scope.installLabel = response.installLabel;

			$scope.bootLabelON = response.bootLabelON;
			$scope.bootLabelOFF = response.bootLabelOFF;
		})
	});

	$scope.handleDependencies = (function (param) {
		if (!$rootScope.status.installed)
			$scope.install = "Installing...";
		else
			$scope.install = "Removing...";

		$api.request({
			module: 'PMKID',
			action: 'handleDependencies',
			destination: param
		}, function (response) {
			if (response.success === true) {
				$scope.installLabel = "warning";
				$scope.processing = true;

				$scope.handleDependenciesInterval = $interval(function () {
					$api.request({
						module: 'PMKID',
						action: 'handleDependenciesStatus'
					}, function (response) {
						if (response.success === true) {
							$scope.processing = false;
							$interval.cancel($scope.handleDependenciesInterval);
							$scope.refreshStatus();
						}
					});
				}, 5000);
			}
		});
	});

	$scope.togglePMKID = (function () {
		if ($scope.status != "Stop")
			$scope.status = "Starting...";
		else
			$scope.status = "Stopping...";

		$scope.statusLabel = "warning";
		$scope.starting = true;

		$rootScope.status.refreshOutput = false;
		$rootScope.status.refreshCaptures = false;

		$api.request({
			module: 'PMKID',
			action: 'togglePMKID',
			interface: $scope.selectedInterface
		}, function (response) {
			$timeout(function () {
				$rootScope.status.refreshOutput = true;
				$rootScope.status.refreshCaptures = true;

				$scope.starting = false;
				$scope.refreshStatus();
			}, 2000);
		})
	});

	$scope.togglePMKIDOnBoot = (function () {
		if ($scope.bootLabelON == "default") {
			$scope.bootLabelON = "success";
			$scope.bootLabelOFF = "default";
		} else {
			$scope.bootLabelON = "default";
			$scope.bootLabelOFF = "danger";
		}

		$api.request({
			module: 'PMKID',
			action: 'togglePMKIDOnBoot',
		}, function (response) {
			$scope.refreshStatus();
		})
	});

	$scope.saveAutostartSettings = (function () {
		$api.request({
			module: 'PMKID',
			action: 'saveAutostartSettings',
			settings: {
				interface: $scope.selectedInterface
			}
		}, function (response) {
			$scope.saveSettingsLabel = "success";
			$timeout(function () {
				$scope.saveSettingsLabel = "default";
			}, 2000);
		})
	});

	$scope.getMonitors = (function () {
		$api.request({
			module: 'PMKID',
			action: 'getMonitors'
		}, function (response) {
			$scope.monitors = response.monitors;
			if (response.selected != "")
				$scope.selectedMonitor = response.selected;
			else
				$scope.selectedMonitor = $scope.monitors[0];
		});
	});

	$scope.refreshStatus();
	$scope.getMonitors();

	$rootScope.$watch('status.refreshMonitors', function (param) {
		if (param) {
			$scope.getMonitors();
		}
	});
}]);

registerController('PMKID_InterfacesController', ['$api', '$scope', '$rootScope', '$timeout', '$interval', '$filter', function ($api, $scope, $rootScope, $timeout, $interval, $filter) {
	$scope.interfaces = [];
	$scope.selectedInterface = '';

	$scope.startMonLabel = "default";
	$scope.startMon = "Start Monitor";
	$scope.startingMon = false;

	$scope.monitors = [];
	$scope.selectedMonitor = '';

	$scope.stopMonLabel = "default";
	$scope.stopMon = "Stop Monitor";
	$scope.stoppingMon = false;

	$scope.startMonitor = (function () {
		$scope.startMonLabel = "warning";
		$scope.startMon = "Starting...";
		$scope.startingMon = true;

		$api.request({
			module: 'PMKID',
			action: 'startMonitor',
			interface: $scope.selectedInterface
		}, function (response) {
			$scope.startMonLabel = "success";
			$scope.startMon = "Done";

			$timeout(function () {
				$scope.getInterfaces();
				$scope.getMonitors();

				$scope.startMonLabel = "default";
				$scope.startMon = "Start Monitor";
				$scope.startingMon = false;
			}, 2000);
		});
	});

	$scope.stopMonitor = (function () {
		$scope.stopMonLabel = "warning";
		$scope.stopMon = "Stopping...";
		$scope.stoppingMon = true;

		$api.request({
			module: 'PMKID',
			action: 'stopMonitor',
			monitor: $scope.selectedMonitor
		}, function (response) {
			$scope.stopMonLabel = "success";
			$scope.stopMon = "Done";

			$timeout(function () {
				$scope.getInterfaces();
				$scope.getMonitors();

				$scope.stopMonLabel = "default";
				$scope.stopMon = "Stop Monitor";
				$scope.stoppingMon = false;
			}, 2000);
		});
	});

	$scope.getInterfaces = (function () {
		$api.request({
			module: 'PMKID',
			action: 'getInterfaces'
		}, function (response) {
			$scope.interfaces = response.interfaces;
			$scope.selectedInterface = $scope.interfaces[0];
		});
	});

	$scope.getMonitors = (function () {
		$rootScope.status.refreshMonitors = false;
		$api.request({
			module: 'PMKID',
			action: 'getMonitors'
		}, function (response) {
			$scope.monitors = response.monitors;
			$scope.selectedMonitor = $scope.monitors[0];

			$rootScope.status.refreshMonitors = true;
		});
	});

	$scope.getInterfaces();
	$scope.getMonitors();
}]);

registerController('PMKID_OutputController', ['$api', '$scope', '$rootScope', '$interval', function ($api, $scope, $rootScope, $interval) {
	$scope.output = '';

	$scope.refreshLabelON = "default";
	$scope.refreshLabelOFF = "danger";

	$scope.refreshOutput = (function () {
		$api.request({
			module: "PMKID",
			action: "refreshOutput",
		}, function (response) {
			$scope.output = response.output;
		})
	});

	$scope.toggleAutoRefresh = (function () {
		if ($scope.autoRefreshInterval) {
			$interval.cancel($scope.autoRefreshInterval);
			$scope.autoRefreshInterval = null;
			$scope.refreshLabelON = "default";
			$scope.refreshLabelOFF = "danger";
		} else {
			$scope.refreshLabelON = "success";
			$scope.refreshLabelOFF = "default";

			$scope.autoRefreshInterval = $interval(function () {
				$scope.refreshOutput();
			}, 5000);
		}
	});

	$scope.refreshOutput();
	$scope.toggleAutoRefresh();

	$rootScope.$watch('status.refreshOutput', function (param) {
		if (param) {
			$scope.refreshOutput();
		}
	});

}]);

registerController('PMKID_HistoryController', ['$api', '$scope', '$rootScope', function ($api, $scope, $rootScope) {
	$scope.captures = [];
	$scope.historyOutput = 'Loading...';
	$scope.historyDate = 'Loading...';

	$scope.refreshCaptures = (function () {
		$api.request({
			module: "PMKID",
			action: "refreshCaptures"
		}, function (response) {
			$scope.captures = response;
		})
	});

	$scope.viewCapture = (function (param) {
		$api.request({
			module: "PMKID",
			action: "viewCapture",
			file: param
		}, function (response) {
			$scope.historyOutput = response.output;
			$scope.historyDate = response.date;
		})
	});

	$scope.deleteCapture = (function (param) {
		$api.request({
			module: "PMKID",
			action: "deleteCapture",
			file: param
		}, function (response) {
			$scope.refreshCaptures();
		})
	});

	$scope.downloadCapture = (function (param) {
		$api.request({
			module: 'PMKID',
			action: 'downloadCapture',
			file: param
		}, function (response) {
			if (response.error === undefined) {
				window.location = '/api/?download=' + response.download;
			}
		});
	});

	$scope.refreshCaptures();

	$rootScope.$watch('status.refreshCaptures', function (param) {
		if (param) {
			$scope.refreshCaptures();
		}
	});

}]);
