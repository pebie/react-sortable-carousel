'use strict';

class Utils {

  /**
   * Get the value contained into a ::before content as a number
   */
  static getCSSBeforeContentAsNumber(node) {
    let computedBefore;
    if(window.getComputedStyle) {
      computedBefore = window.getComputedStyle(node, ':before');
      if(computedBefore && computedBefore.content) {
        return parseInt(computedBefore.content.match(/\d+/g)[0], 10);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Count how much pages are necessary
   */
  static countPages(total, byPage) {
    return Math.ceil(total / byPage);
  }

  /**
   * How much items are shown for the last page ?
   */
  static countLastPageItems(total, byPage) {
    let pages = Utils.countPages(total, byPage);
    return byPage - (pages*byPage - total);
  }

  /**
   * Let's do some throttling
   */
  static throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    let last,
        deferTimer;
    return function () {
      let context = scope || this;

      let now = +new Date,
          args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }

  /**
   * Pick some items before or after with loopping
   */
  static pick(source, count, isReverse = false, currentIndex = 0) {
    let [loopIndex, localSource, output] = [0, source.slice(0), []];

    if(isReverse) localSource.reverse();

    while(loopIndex < count) {
      output.push(localSource[currentIndex]);
      currentIndex = currentIndex < localSource.length - 1 ? currentIndex + 1 : 0;
      loopIndex++;
    }

    return {
      currentIndex: currentIndex,
      result: isReverse ? output.reverse() : output
    }

  }

  /**
   * Set unique keys to an object
   */
  static uniqueKeys(source, keyName = '_key_') {
    let i = 0;
    for(i; i < source.length ; i++) {
      source[i][keyName] = i;
    }
    return source;
  }

  /**
   * Get a page index for an item index
   */
  static getPageForIndex(itemIndex, itemsByPage) {
    return Math.floor(itemIndex/itemsByPage);
  }

}

export default Utils;
