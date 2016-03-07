/**
 * Ported from github.com/unified-font-object/ufoLib
 * Lib/ufoLib/converters.py at 337ef3202b49a9a4848aab1f93248823c2757d61
 */
define([], function() {
    "use strict";
    // Conversion functions.


    /**
     * This will find kerning groups with known prefixes.
     * In some cases not all kerning groups will be referenced
     * by the kerning pairs. The algorithm for locating groups
     * in convertUFO1OrUFO2KerningToUFO3Kerning will miss these
     * unreferenced groups. By scanning for known prefixes
     * this function will catch all of the prefixed groups.
     *
     * These are the prefixes and sides that are handled:
     * @MMK_L_ - side 1
     * @MMK_R_ - side 2
     *
     * >>> testGroups = {
     * ...     "@MMK_L_1" : None,
     * ...     "@MMK_L_2" : None,
     * ...     "@MMK_L_3" : None,
     * ...     "@MMK_R_1" : None,
     * ...     "@MMK_R_2" : None,
     * ...     "@MMK_R_3" : None,
     * ...     "@MMK_l_1" : None,
     * ...     "@MMK_r_1" : None,
     * ...     "@MMK_X_1" : None,
     * ...     "foo" : None,
     * ... }
     * >>> first, second = findKnownKerningGroups(testGroups)
     * >>> sorted(first)
     * ['@MMK_L_1', '@MMK_L_2', '@MMK_L_3']
     * >>> sorted(second)
     * ['@MMK_R_1', '@MMK_R_2', '@MMK_R_3']
     */
    function findKnownKerningGroups(groups) {
        var prefixes = {
                first: ['@MMK_L_']
              , second: ['@MMK_R_']
            }
          , result = {first: new Set(), second: new Set()}
          , groupName, side, groupPrefixes, i, l, prefix
          ;

        groupsLoop:
        for(groupName in groups) {
            for(side in prefixes) {
                groupPrefixes = prefixes[side];
                for(i=0,l=groupPrefixes.length;i<l;i++) {
                    prefix = groupPrefixes[i];
                    if(groupName.indexOf(prefix) === 0) {
                        result[side].add(groupName);
                        continue groupsLoop;
                    }
                }
            }
        }
        return [result.first, result.second];
    }

    function makeUniqueGroupName(existingNames, name) {
        // Add a number to the name
        var newName = name
          , counter = 0
          ;

        while(existingNames.has(newName)) {
            counter += 1;
            newName = newName + counter;
        }
        return newName;
    }

    function _renameGroups(existingNames, prefix, name) {
        //jshint validthis:true
        var newName = makeUniqueGroupName(existingNames, prefix + name);
        existingNames.add(newName);
        this[name] = newName;
    }

    //adapted from the UFO spec
    function convertUFO1OrUFO2KerningToUFO3Kerning(kerning, groups) {
        // gather known kerning groups based on the prefixes
        var referencedGroups = findKnownKerningGroups(groups)
          , firstReferencedGroups = referencedGroups[0]
          , secondReferencedGroups = referencedGroups[1]
          , first, seconds, second
          , firstRenamedGroups = Object.create(null)
          , secondRenamedGroups = Object.create(null)
          , existingNames
          , newKerning = Object.create(null)
          , newSeconds, value, oldName
          , newGroups, k
          ;
        // Make lists of groups referenced in kerning pairs.
        for(first in kerning) {
            seconds = kerning[first];
            if(first in groups && first.indexOf('public.kern1.') !== 0)
                firstReferencedGroups.add(first);

            for(second in seconds)
                if(second in groups && second.indexOf('public.kern2.') !== 0)
                    secondReferencedGroups.add(second);
        }

        // Create new names for these groups.
        existingNames = new Set(Object.keys(groups));
        firstReferencedGroups.forEach(_renameGroups.bind(
                        firstRenamedGroups, existingNames, 'public.kern1.'));
        existingNames = new Set(Object.keys(groups));
        secondReferencedGroups.forEach(_renameGroups.bind(
                        secondRenamedGroups, existingNames, 'public.kern2.'));


        // Populate the new group names into the kerning dictionary as needed.
        for(first in kerning) {
            seconds = kerning[first];
            first = firstRenamedGroups[first] || first;
            newSeconds = Object.create(null);
            for(second in seconds) {
                value = seconds[second];
                second = secondRenamedGroups[second] || second;
                newSeconds[second] = value;
            }
            newKerning[first] = newSeconds;
        }

        // Make copies of the referenced groups and store them
        // under the new names in the overall groups dictionary.
        newGroups = Object.create(null);
        for(k in groups)
            newGroups[k] = Array.prototype.slice.call(groups[k]);

        for(oldName in firstRenamedGroups)
            newGroups[firstRenamedGroups[oldName]] = Array.prototype.slice.call(groups[oldName]);
        for(oldName in secondRenamedGroups)
            newGroups[secondRenamedGroups[oldName]] = Array.prototype.slice.call(groups[oldName]);

        // Return the kerning and the groups.
        return [newKerning, newGroups, {side1:firstRenamedGroups, side2:secondRenamedGroups}];
    }

    return {
        findKnownKerningGroups: findKnownKerningGroups
      , makeUniqueGroupName: makeUniqueGroupName
      , convertUFO1OrUFO2KerningToUFO3Kerning: convertUFO1OrUFO2KerningToUFO3Kerning
    };
});
