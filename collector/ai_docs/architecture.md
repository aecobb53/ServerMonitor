# Architecture

I need the Collector to monitor docker containers for state, status, and errors. This is important as it will then be served up to a ui way down the road.

## Key Features

The Collector needs to be very simple, but good at collecting any amount of information we need from the containers.

### Tracking Containers
Each container to track will have some labels. `server_monitor.enabled` when true will indicate that it is to be tracked. So the Collector should be gathering information on it. 

Setting `server_monitor.parser: "valheim"` will tell the collector what parser to use. 

Setting `server_monitor.server_name: "Hellheim"` will tell the collector what to call it.

Together these make it easy for container owners to tweak things quickly.

```yaml
server_monitor.enabled: "true"
server_monitor.parser: "valheim"
server_monitor.server_name: "Hellheim"
```

The collector needs to track new containers when they are stood up, constantly be getting updates from the currently running containers, and forgetting about containers that have stopped.

### Communicating out
The Collector is designed to ONLY look at other containers on the network and not be accessible in any other way. To communicate state out. it will write a file and keep the file up to date with state changes. This file needs to include current state, a history of state changes, errors, and metadata.

There will be local directorie(s) mounted where these files can be saved.

### Hardening
I want the collector to be smart enough to be able to recover if it gets into an odd state while running. the first version seemed to choke some times and miss logs or not update the state and get "stuck" in a stale state. So it needs to be able to audit itself i guess. It also needs to handle being restarted and pick back up where it left off again

