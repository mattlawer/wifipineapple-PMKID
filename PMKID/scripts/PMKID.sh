#!/bin/sh
#2019 - mattlawer & adde88

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/sd/lib:/sd/usr/lib
export PATH=$PATH:/sd/usr/bin:/sd/usr/sbin

if [ "$1" = "start" ]; then
  MYTIME=`date +%s`
  MYINTERFACE=`uci get PMKID.run.interface`
  RUNFOLDER=/pineapple/modules/PMKID/log/${MYTIME}
	mkdir -p ${RUNFOLDER}
  LOG=${RUNFOLDER}/PMKID.log

  if [ -z "$MYINTERFACE" ]; then
    MYINTERFACE=`iwconfig 2> /dev/null | grep "mon*" | awk '{print $1}'`
    if [ -z "$MYINTERFACE" ]; then
      IFACE=`iwconfig 2> /dev/null | grep "wlan*" | grep -v "mon*" | awk '{print $1}'`
      airmon-ng start ${IFACE}
      MYINTERFACE=`iwconfig 2> /dev/null | grep "mon*" | awk '{print $1}' | grep ${IFACE}`
    fi
  else
    MYFLAG=`iwconfig 2> /dev/null | grep "mon*" | awk '{print $1}' | grep ${MYINTERFACE}`
    if [ -z "$MYFLAG" ]; then
      airmon-ng start ${MYINTERFACE}
      MYINTERFACE=`iwconfig 2> /dev/null | grep "mon*" | awk '{print $1}' | grep ${MYINTERFACE}`
    else
      MYINTERFACE=${MYFLAG}
    fi
  fi

  uci set PMKID.run.interface=`echo ${MYINTERFACE} | sed -e 's/\(mon\)*$//g'`
  uci set PMKID.run.log=${MYTIME}
  uci commit PMKID.run.interface
  uci commit PMKID.run.log
  
  echo -e "$(date +'%d/%m/%y %H:%M:%S') starting manually" >> ${LOG}
  echo -e "interface : ${MYINTERFACE}" >> ${LOG}
  
  hcxdumptool -o ${RUNFOLDER}/hcxdump.pcapng -i ${MYINTERFACE} --enable_status 0 &> /dev/null &

  echo -e "running from ${RUNFOLDER}" >> ${LOG}
elif [ "$1" = "stop" ]; then
  MYTIME=`uci get PMKID.run.log`
	RUNFOLDER=/pineapple/modules/PMKID/log/${MYTIME}
	LOG=${RUNFOLDER}/PMKID.log

	if [ -f ${LOG} ]; then
		echo -e " - stopping -" >> ${LOG}
	fi
  killall -2 hcxdumptool
  hcxpcapngtool -o ${RUNFOLDER}/hcxdump.22000 ${RUNFOLDER}/hcxdump.pcapng
fi
