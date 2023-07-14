<?php namespace pineapple;

class PMKID extends Module
{
    public function route()
    {
        switch ($this->request->action) {
            case 'refreshInfo':
                $this->refreshInfo();
                break;
            case 'refreshStatus':
                $this->refreshStatus();
				break;
			case 'handleDependenciesStatus':
                $this->handleDependenciesStatus();
                break;
			case 'handleDependencies':
                $this->handleDependencies();
                break;
            case 'getInterfaces':
                $this->getInterfaces();
                break;
            case 'getMonitors':
                $this->getMonitors();
                break;
            case 'startMonitor':
                $this->startMonitor();
                break;
            case 'stopMonitor':
                $this->stopMonitor();
                break;
			case 'togglePMKID':
                $this->togglePMKID();
                break;
            case 'togglePMKIDGOnBoot':
                $this->togglePMKIDOnBoot();
                break;
            case 'saveAutostartSettings':
                $this->saveAutostartSettings();
                break;
            case 'refreshOutput':
                $this->refreshOutput();
                break;
            case 'refreshCaptures':
                $this->refreshCaptures();
                break;
            case 'viewCapture':
                $this->viewCapture();
                break;
            case 'deleteCapture':
                $this->deleteCapture();
                break;
            case 'downloadCapture':
                $this->downloadCapture();
                break;
        }
    }
    
    /* PMKID_Controller */
    
    protected function refreshInfo() {
        $moduleInfo = @json_decode(file_get_contents("/pineapple/modules/PMKID/module.info"));
        $this->response = array('title' => $moduleInfo->title, 'version' => $moduleInfo->version);
    }
    
    /* PMKID_ControlsController */
    
    private function refreshStatus() {
        if (!file_exists('/tmp/PMKID.progress')) {
            if (!$this->checkDeps("hcxdumptool") || !$this->checkDeps("hcxpcapngtool")) {
                $installed = false;
                $install = "Not installed";
                $installLabel = "danger";
                $processing = false;

                $status = "Start";
                $statusLabel = "success";

                $bootLabelON = "default";
                $bootLabelOFF = "danger";
            } else {
                $installed = true;
                $install = "Installed";
                $installLabel = "success";
                $processing = false;

                if ($this->checkRunning("hcxdumptool")) {
                    $status = "Stop";
                    $statusLabel = "danger";
                } else {
                    $status = "Start";
                    $statusLabel = "success";
                }

                if (exec("cat /etc/rc.local | grep PMKID/scripts/autostart_PMKID.sh") == "") {
                    $bootLabelON = "default";
                    $bootLabelOFF = "danger";
                } else {
                    $bootLabelON = "success";
                    $bootLabelOFF = "default";
                }
            }
        } else {
            $installed = false;
            $install = "Installing...";
            $installLabel = "warning";
            $processing = true;

            $status = "Not running";
            $statusLabel = "danger";
            $verbose = false;

            $bootLabelON = "default";
            $bootLabelOFF = "danger";
        }

        $device = $this->getDevice();
        $sdAvailable = $this->isSDAvailable();

        $this->response = array(
        	"device" => $device,
        	"sdAvailable" => $sdAvailable,
        	"status" => $status,
        	"statusLabel" => $statusLabel,
        	"installed" => $installed,
        	"install" => $install,
        	"installLabel" => $installLabel,
        	"bootLabelON" => $bootLabelON,
        	"bootLabelOFF" => $bootLabelOFF,
        	"processing" => $processing
        );
    }
    
    private function handleDependenciesStatus() {
        if (!file_exists('/tmp/PMKID.progress')) {
            $this->response = array('success' => true);
        } else {
            $this->response = array('success' => false);
        }
    }
    
    private function handleDependencies() {
        if (!$this->checkDeps("hcxdumptool") || !$this->checkDeps("hcxpcapngtool")) {
            $this->execBackground("/pineapple/modules/PMKID/scripts/dependencies.sh install ".$this->request->destination);
            $this->response = array('success' => true);
        } else {
            $this->execBackground("/pineapple/modules/PMKID/scripts/dependencies.sh remove");
            $this->response = array('success' => true);
        }
    }
    
    private function getInterfaces() {
        exec("iwconfig 2> /dev/null | grep \"wlan*\" | grep -v \"mon*\" | awk '{print $1}'", $interfaceArray);
        $this->response = array("interfaces" => $interfaceArray);
    }

    private function getMonitors() {
        exec("iwconfig 2> /dev/null | grep \"mon*\" | awk '{print $1}'", $monitorArray);
        $this->response = array(
            "monitors" => $monitorArray,
        	"selected" => reset(preg_grep('/^'.$this->uciGet("PMKID.run.interface").'/', $monitorArray))
        );
    }

    private function startMonitor() {
        exec("airmon-ng start ".$this->request->interface);
    }

    private function stopMonitor() {
        exec("airmon-ng stop ".$this->request->monitor);
    }
    
    private function togglePMKID() {
        if (!$this->checkRunning("hcxdumptool")) {
            $this->uciSet("PMKID.run.interface", $this->request->interface);
            $this->execBackground("/pineapple/modules/PMKID/scripts/PMKID.sh start");
        } else {
            //$this->uciSet("PMKID.run.interface", '');
            $this->execBackground("/pineapple/modules/PMKID/scripts/PMKID.sh stop");
        }
    }
    
    private function togglePMKIDGOnBoot() {
        if (exec("cat /etc/rc.local | grep PMKID/scripts/autostart_PMKID.sh") == "") {
            exec("sed -i '/exit 0/d' /etc/rc.local");
            exec("echo /pineapple/modules/PMKID/scripts/autostart_PMKID.sh >> /etc/rc.local");
            exec("echo exit 0 >> /etc/rc.local");
        } else {
            exec("sed -i '/PMKID\/scripts\/autostart_PMKID.sh/d' /etc/rc.local");
        }
    }
    
    private function saveAutostartSettings() {
        $settings = $this->request->settings;
        $this->uciSet("PMKID.autostart.interface", rtrim($settings->interface, 'mon'));
    }
    
    /* PMKID_OutputController */
    
    private function refreshOutput() {
        $logPath="/pineapple/modules/PMKID/log/".$this->uciGet("PMKID.run.log");
        if ($this->checkRunning("hcxdumptool") && file_exists($logPath)) {
            exec("hcxpcapngtool -o ".$logPath."/hcxdump.22000 ".$logPath."/hcxdump.pcapng > ".$logPath."/PMKID.log");

            exec("cat ".$logPath."/PMKID.log", $output);

            if (!empty($output)) {
                $this->response = array("output" => implode("\n", $output));
            } else {
                $this->response = array("output" => "Empty log...");
            }
        } else {
            $this->response = array("output" => "hcxdumptool is not running");
        }
    }
    
    /* PMKID_HistoryController */

    private function refreshCaptures() {
        $this->streamFunction = function () {
            $log_list = array_reverse(glob("/pineapple/modules/PMKID/log/*"));

            echo '[';
            for ($i=0;$i<count($log_list);$i++) {
	            $entryName = basename($log_list[$i]);
                $entryDate = gmdate('Y-m-d H-i-s', $entryName);

                $entryPcapngSize = $this->human_filesize(filesize($log_list[$i]."/hcxdump.pcapng"));
                $entry22000Size = $this->human_filesize(filesize($log_list[$i]."/hcxdump.22000"));
                
                $disableDelete = $i == 0 && $this->checkRunning("hcxdumptool");

                echo json_encode(array($entryName, $entryDate, $entryPcapngSize, $entry22000Size, $disableDelete));

                if ($i!=count($log_list)-1) {
                    echo ',';
                }
            }
            echo ']';
        };
    }
    
    private function viewCapture() {
        $logPath="/pineapple/modules/PMKID/log/".$this->request->file;
        $log_date = gmdate("F d Y H:i:s", $this->request->file);

        exec("hcxpcapngtool -o ".$logPath."/hcxdump.22000 ".$logPath."/hcxdump.pcapng > ".$logPath."/PMKID.log");
        exec("cat ".$logPath."/PMKID.log", $output);
        
        if (!empty($output)) {
            $this->response = array("output" => implode("\n", $output), "date" => $log_date);
        } else {
            $this->response = array("output" => "Empty log...", "date" => $log_date);
        }
    }

    private function deleteCapture() {
        exec("rm -rf /pineapple/modules/PMKID/log/".$this->request->file);
    }

    private function downloadCapture() {
        $this->response = array( "download" => $this->downloadFile("/pineapple/modules/PMKID/log/".$this->request->file) );
    }


	/* Protected */
    
    protected function checkDeps($dependencyName) {
        return ($this->checkDependency($dependencyName) && ($this->uciGet("PMKID.module.installed")));
    }

    protected function getDevice() {
        return trim(exec("cat /proc/cpuinfo | grep machine | awk -F: '{print $2}'"));
    }
    
    protected function human_filesize($bytes, $decimals = 2) {
		$sz = 'BKMGTP';
		$factor = floor((strlen($bytes) - 1) / 3);
		return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
	}
}
