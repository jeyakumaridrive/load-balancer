-- jitsi-meet stats test
--
-- Author : Hamza KHAIT

local json = require "util.json";
local http = require "net.http";
local muc_size_url="http://localhost:5280/room";

-- Track users as they bind
module:hook("resource-bind", function(event)
	log("info", "TEST resource-bind");
end)

-- Track users as they unbind
module:hook("resource-unbind", function(event)
	log("info", "TEST resource-unbind");
end)

-- Track MUC occupants as they join/leave
module:hook("muc-occupant-joined", function(event)
	log("info", "muc-occupant-joined");
end)

module:hook("muc-occupant-left", function(event)
	log("info", "muc-occupant-left");
end)
