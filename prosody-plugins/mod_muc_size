function has_value(tab, val)
   for _, value in ipairs(tab) do
       if value == val then
           return true
       end
   end
   return false
end

function get_info_rooms()
   local innerValues = {};
   local keyRoom = "jitsi_bosh_query_room";
   for _, value in pairs(prosody.full_sessions) do
       if tostring(value["username"]:lower()) ~= "focus" then
           for innerKey, innerValue in pairs(value) do
               if innerKey == keyRoom and not has_value(innerValues, innerValue) then
                   table.insert(innerValues, innerValue)
               end
           end
       end
   end
return json.encode(innerValues);
end
