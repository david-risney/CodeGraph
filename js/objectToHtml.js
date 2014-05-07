var objectToHtml = (function () {
    "use strict";

    function objectProperties(object) {
        var name,
            value,
            properties = [];

        for (name in object) {
            if (object.hasOwnProperty(name)) {
                try {
                    value = object[name];
                } catch (e) {
                    value = e;
                }
                properties.push({ name: name, value: value });
            }
        }

        return properties;
    }

    function isEventAttribute(element, attributeName) {
        return attributeName.substr(0, 2) === "on" &&
            element[attributeName] !== undefined;
    }

    function objectToHtml(elementState) {
        var nameProperty = objectProperties(elementState).filter(function (property) {
            return property.name !== "c" &&
                property.name !== "s" &&
                property.name !== "e" &&
                property.name !== "t";
        })[0],
            contentProperty = elementState.c || [],
            styleProperty = elementState.s,
            eventProperty = elementState.e,
            textProperty = elementState.t,
            tagName = nameProperty.name,
            attributesMap = nameProperty.value || {},
            element;

        element = document.createElement(tagName);
        if (textProperty) {
            element.textContent = textProperty;
        }

        objectProperties(attributesMap).filter(function (attribute) {
            if (isEventAttribute(element, attribute.name)) {
                throw new Error("Set events using e: {eventName: function...}");
            }
            return attribute;
        }).forEach(function (attribute) { element.setAttribute(attribute.name, attribute.value); });

        objectProperties(styleProperty).forEach(function (style) { element.style[style.name] = style.value; });
        objectProperties(eventProperty).forEach(function (event) { element.addEventListener(event.name, event.value); });
        contentProperty.map(objectToHtml).forEach(function (childElement) { element.appendChild(childElement); });

        return element;
    }

    return objectToHtml;
}(this));