import React               from 'react';
import classNames          from 'classnames';
import { DragDropContext } from 'react-dnd';
import HTML5Backend        from 'react-dnd/modules/backends/HTML5';
import Utils               from './core/utils';
import CarouselItem        from './CarouselItem';
import { DropTarget }      from 'react-dnd';


class Carousel extends React.Component {

  /**
   * Ctor
   */
  constructor(props) {
    super(props);

    // Local vars
    this.itemsByPage = 0;
    this.originalTouchX = null;
    // Store last indexes for back/next cloned elements (infinite)
    this.infiniteBounds = [0, 0];
    // Items with unique indexes
    this.itemsWithUniqIndexes = Utils.uniqueKeys(props.items, '_index_').slice();
    // States
    this.state = {
      page: this.props.page,
      items: this.itemsWithUniqIndexes,
      totalPages: 0,
      dragOffset: 0,
      animate: false,
      didSlide: false
    };
    // Dont be able to animate until ready
    this.lockAnimation = true;
    // Bind the scopes
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = Utils.throttle(this.handleTouchMove, this.props.dragThrottling, this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.goPrev = this.goPrev.bind(this);
    this.goNext = this.goNext.bind(this);
  }

  /**
   * Add a carousel instance
   */
  static addInstance(carousel) {
    Carousel.addEventListeners();
    Carousel._instances.push(carousel);
  }

  /**
   * Clear all stored instances
   */
  static resetInstances() {
    Carousel._instances = [];
  }

  /**
   * Removing an instance
   */
  static removeInstance(instance) {
    Carousel._instances = Carousel._instances.filter(function(i) {
      return i !== instance;
    });
  }

  /**
   * Add the listeners as a static method
   * Will be done only once for all the carousels into a page
   */
  static addEventListeners() {
    let throttled;
    if(!Carousel._instances.length) {
      throttled = Utils.throttle(Carousel.onViewportChange, 100, this);
      window.addEventListener('resize', throttled);
      window.addEventListener('orientationchange', throttled);
    }
  }

  /**
   * Dispatch the event to all instances
   */
  static onViewportChange(e) {
    Carousel.resetGroupProcessed();
    Carousel._instances.forEach(function(instance) {
      if(instance.onViewportChange) instance.onViewportChange();
    });
  }

  /**
   * Set a new custom template
   */
  static setTemplate(key, tpl) {
    Carousel._templates[key] = tpl;
  }

  /**
   * Get a custom template
   */
  static getTemplate(key) {
    if(Carousel._templates[key]) return Carousel._templates[key];
    else return false;
  }

  /**
   * Don't recalculate widths for a group - setter
   */
  static setGroupWidth(group, width) {
    if(!Carousel.isGroupProcessed(group)) {
      Carousel.processGroup(group);
      Carousel._groupsWidths[group] = width;
    }
  }

  /**
   * Don't recalculate widths for a group - getter
   */
  static getGroupWidth(group) {
    return Carousel._groupsWidths[group];
  }

  static processGroup(group) {
    Carousel._groupsProcessed.push(group);
  }

  static isGroupProcessed(group) {
    return Carousel._groupsProcessed.indexOf(group) > -1;
  }

  static resetGroupProcessed() {
    Carousel._groupsProcessed = [];
  }

  /**
   * Before the rendering
   */
  componentWillMount() {
    // Replace the template name by the good one if custom
    if(this.props.customTemplateFn && Carousel.getTemplate(this.props.customTemplateFn)) {
      this.customTemplateFn = Carousel.getTemplate(this.props.customTemplateFn);
    }
  }

  componentWillReceiveProps (nextProps) {
    this.itemsWithUniqIndexes = Utils.uniqueKeys(nextProps.items, '_index_').slice();
    let totalPage = Utils.countPages(nextProps.items.length, this.itemsByPage);
      this.setState({
        items: this.itemsWithUniqIndexes,
        totalPages: totalPage
      })
  }

  /**
   * When the component is ready (calculate the number of pages)
   */
  componentDidMount() {
    Carousel.addInstance(this);
    // Reset the pagination
    this.reset();
    // When a slide is done
    React.findDOMNode(this.refs.track).addEventListener('transitionend', this.onTrackTransition.bind(this));
    // Select the page of an item to show
    if(this.props.showItemAtIndex) {
      this.setState({
        page: Utils.getPageForIndex(this.props.showItemAtIndex, this.itemsByPage)
      });
    }
    // Infinite mode, should add items before and after
    if(this.props.infinite) this.setInfiniteBoundaries();
    // Set the carousel as animated when it's ready
    // RequestAnimationFrame was too fast
    // Empty setTimeout do a "nextTick()"
    this.initAnimationsTimeout = setTimeout(() => {
      this.setState({ animate: true });
      this.lockAnimation = false;
    });
  }

  /**
   * Carousel destruction
   */
  componentWillUnmount() {
    Carousel.removeInstance(this);
    if(this.initAnimationsTimeout) clearTimeout(this.initAnimationsTimeout);
  }

  /**
   * If it's infinite, we should put some items before and after
   */
  setInfiniteBoundaries() {
    let before = Utils.pick(this.state.items, this.itemsByPage, true);
    let after = Utils.pick(this.state.items, this.itemsByPage);
    this.infiniteBounds = [before.currentIndex, after.currentIndex];
    this.setState({
      items: before.result.concat(this.state.items).concat(after.result)
    });
  }

  /**
   * Reset the carousel
   */
  reset() {
    this.setItemsByPage();
    this.setTotalPages();

    if(this.props.group.length && !Carousel.isGroupProcessed(this.props.group)) {
      // Store the slider width for a group to avoid to calculate it several times
      this.trackWidth = this.getTrackWidth();
      Carousel.setGroupWidth(this.props.group, this.trackWidth);
    } else if(this.props.group.length) {
      // Get the stored value to avoid loud `offsetWidth`
      this.trackWidth = Carousel.getGroupWidth(this.props.group);
    } else {
      this.trackWidth = this.getTrackWidth();
    }
  }

  /**
   * Need to know the track width to calculate last page
   */
  getTrackWidth() {
    return React.findDOMNode(this.refs.track).offsetWidth;
  }

  /**
   * When the viewport is changing (orientationchange, resize, ...)
   */
  onViewportChange() {
    this.reset();
  }

  /**
   * Get the classname for
   */
  getRootClassName() {
    var classes = {};
    classes[this.props.basename] = true;
    classes[this.props.theme] = this.props.theme.length;
    classes[this.props.animatedState] = this.state.animate;
    return classes;
  }

  /**
   * Use the value stored into the content of the container's before tag to know how
   * much items should be visible for a page
   */
  setItemsByPage() {
    this.itemsByPage = Utils.getCSSBeforeContentAsNumber(React.findDOMNode(this)) || 1;
  }

  /**
   * Set total pages
   */
  setTotalPages() {
    this.setState({
      totalPages: Utils.countPages(this.state.items.length, this.itemsByPage)
    });
  }

  /**
   * Generate the translation for the next carousel position
   */
  getStyleForTransition() {
    if(!this.itemsByPage) return;

    let translate3d, offset, lastPageCount, calc, expr;

    // The offset is relative to the current page
    if(this.isLastPage() && !this.props.infinite) {
      lastPageCount = Utils.countLastPageItems(this.state.items.length, this.itemsByPage);
      offset = ((this.state.page - 1) + (lastPageCount / this.itemsByPage)) * 100;
    } else {
      offset = this.state.page * 100;
    }

    // Infinite mode, one page is added before
    if(this.props.infinite) offset += 100;

    if(!this.state.dragOffset) {
      // W/out dragging, use percents (performance)
      translate3d = `translate3d(-${offset}%,0,0)`;
    } else {
      // W/ dragging, we should do some calcs
      // Using calc into translate should be better but IE isnt working
      expr = ((this.trackWidth * offset / 100) + this.state.dragOffset);
      translate3d = `translate3d(-${expr}px,0,0)`;
    }

    return {
      WebkitTransform: translate3d,
      transform: translate3d
    };

  }

  /**
   * Track the first slide, triggers the lazy loading
   */
  trackSlide() {
    if(!this.state.didSlide) this.setState({ didSlide: true });
  }

  /**
   * When a transition is done
   */
  onTrackTransition() {
    // Add/Remove items for the infinite pagination
    if(this.props.infinite) {
      this.shiftInfinite(this.animatingRight);
    } else {
      this.lockAnimation = false;
    }
  }

  /**
   * Infinite mode, remove from one side and an to the other
   */
  shiftInfinite(toTheRight = false) {
    let items = this.state.items.slice(0);
    let boundIndex = toTheRight ? 1 : 0;

    // Get clones items
    let clones = Utils.pick(this.itemsWithUniqIndexes, this.itemsByPage, !boundIndex, this.infiniteBounds[boundIndex]);
    this.infiniteBounds[boundIndex] = clones.currentIndex;

    // Remove useless items
    for(let i = 0; i < this.itemsByPage; i++) {
      toTheRight ? items.shift() : items.pop();
    }

    // Add new items
    if(toTheRight) items = items.concat(clones.result);
    else items = clones.result.concat(items);

    // Cancel animation (disable animations and change the position)
    // Adding new items should not move the carousel
    this.setState({
      animate: false,
      items: items,
      page: toTheRight ? this.state.page - 1 : this.state.page + 1
    });

    // A requestAnimationFrame is not enough
    setTimeout(() => {
      this.lockAnimation = false;
      this.setState({ animate: true });
    });

  }

  /**
   * Go to the previous page
   */
  goPrev() {
    if((this.isFirstPage() && !this.props.infinite) || this.lockAnimation) return;
    this.lockAnimation = true;
    this.animatingRight = false;
    this.trackSlide();
    let page = this.state.page - 1;
    this.setState({ page: page });
    this.notifyPageChange(page);
  }

  /**
   * Go to the next page
   */
  goNext() {
    if((this.isLastPage() && !this.props.infinite) || this.lockAnimation) return;
    this.lockAnimation = true;
    this.animatingRight = true;
    this.trackSlide();
    let page = this.state.page + 1;
    this.setState({ page: page });
    this.notifyPageChange(page);
  }

  /**
   * When changing a page
   */
  notifyPageChange(page) {
    this.props.pageChangeCallback(page);
  }

  /**
   * The current page is the first ?
   */
  isFirstPage() {
    return this.state.page === 0;
  }

  /**
   * The current page is the last ?
   */
  isLastPage() {
    return this.state.page + 1 === this.state.totalPages;
  }

  /**
   * When starting to touch
   */
  handleTouchStart(e) {
    this.slideOffsetX = 0;
    this.originalTouchX = e.nativeEvent.touches[0].clientX;
    this.setState({ animate: false });
  }

  /**
   * When moving the touch pointer
   */
  handleTouchMove(e) {
    if(!e.nativeEvent) return;

    // Set the new dragged state
    this.slideOffsetX = this.originalTouchX - e.nativeEvent.touches[0].clientX;

    // Prevent the event for horizontal slides only (dont broke vertical scroll)
    if(Math.abs(this.slideOffsetX) > this.props.verticalThreshold) {
      e.nativeEvent.preventDefault();
    }

    // Trigger a slide manually
    this.setState({ dragOffset: this.slideOffsetX });
  }

  /**
   * When stopping to touch
   */
  handleTouchEnd(e) {
    this.originalTouchX = null;
    this.setState({ dragOffset: 0, animate: true });
    // Go prev or next
    if(Math.abs(this.slideOffsetX) > this.props.dragThreshold) {
      this.state.dragOffset < 0 ? (!this.isFirstPage() && this.goPrev()) : (!this.isLastPage() && this.goNext());
    }
  }

  /**
   * Check if an item is ready to be shown or not
   */
  isItemReady(index) {
    // Items count unready, items not ready
    if(!this.itemsByPage) return false;
    // A slide was done, all items should be loaded
    else if(this.state.didSlide) return true;
    // Load only some items (number items +/- 1/2 number items)
    else {
      let offset = this.state.page * this.itemsByPage;
      if(this.props.infinite) offset += this.itemsByPage;
      let boundDown = offset - Math.ceil(this.itemsByPage / 2);
      let boundUp = offset + this.itemsByPage + Math.ceil(this.itemsByPage / 2);
      return index >= boundDown && index < boundUp;
    }
  }

  /**
   * Remove item for an index
   */
  removeItem(index) {
    var newItems = [];
    this.itemsWithUniqIndexes.map((item, key) => {
      if(item._index_ !== index) {
        newItems.push(item);
      }
    });
    this.itemsWithUniqIndexes = newItems;
    this.setState({ items: newItems })
  }
  containsObject(obj, list) {
      var i;
      for (i = 0; i < list.length; i++) {
          if (list[i] === obj) {
              return true;
          }
      }

      return false;
  }

  /**
   * Render an item
   */
  renderItem(item, index) {
    var removeItem = this.removeItem.bind(this);
    return (
      <CarouselItem
        key={item.id}
        basename={this.props.basename}
        isReady={this.isItemReady(index)}
        clickCallback={this.props.clickCallback}
        customTemplateFn={this.customTemplateFn}
        removeItemFn={removeItem}
        data={item}
        index={index}
        id={item.id}
        moveCard={this.props.moveCard}
        sortable={this.props.sortable}
        accepts={this.props.accepts}
        onDrop={this.props.onDrop}
      />
    );
  }

  /**
   * Render the items list
   */
  renderItemsList() {
    if(this.state.items.length>0){
      return this.state.items.map((item, key) => {
        return this.renderItem(item, key);
      });
    }
  }

  /**
   * Carousel rendering
   */
  render() {

    let backButton, nextButton;
    let {connectDropTarget} = this.props;
    // Carousel navigation
    if(this.state.items.length > this.itemsByPage) {
      if(!this.isFirstPage() || this.props.infinite) backButton = <button onClick={this.goPrev} className={ `${this.props.basename}__button ${this.props.basename}__button--left` }></button>;
      if(!this.isLastPage() || this.props.infinite) nextButton = <button onClick={this.goNext} className={ `${this.props.basename}__button ${this.props.basename}__button--right` }></button>;
    }

    // Do the rendering
    return (
      <div className={classNames(this.getRootClassName())}>
        {backButton}
        <div onTouchStart={this.handleTouchStart} onTouchMove={this.handleTouchMove} onTouchEnd={this.handleTouchEnd} ref='track' className={ `${this.props.basename}__track` }>
          <div className={ `${this.props.basename}__content` } style={this.getStyleForTransition()}>
            { this.renderItemsList() }
          </div>
        </div>
        {nextButton}
      </div>
    );
  }

}

/**
 * Initialize the default props
 */
Carousel.defaultProps = {
  page: 0,
  sortable: false,
  basename: 'dedcarousel',
  animatedState: 'is-animated',
  customTemplateFn: undefined,
  clickCallback: function() {},
  pageChangeCallback: function() {},
  infinite: false,
  theme: '',
  items: [],
  dragThreshold: 150,
  dragThrottling: 50,
  verticalThreshold: 10,
  group: '',
  showItemAtIndex: false
};

/**
 * Props types definition
 */
Carousel.propTypes = {
  theme: React.PropTypes.string,
  items: React.PropTypes.array,
  infinite: React.PropTypes.bool,
  page: React.PropTypes.number,
  basename: React.PropTypes.string,
  customTemplateFn: React.PropTypes.string,
  clickCallback: React.PropTypes.func,
  pageChangeCallback: React.PropTypes.func,
  dragThreshold: React.PropTypes.number,
  group: React.PropTypes.string,
  sortable: React.PropTypes.bool,
  moveCard: React.PropTypes.func.isRequired,
  showItemAtIndex: React.PropTypes.oneOfType([
    React.PropTypes.bool,
    React.PropTypes.number
  ])
};

/**
 * Store all the carousels instances
 */
Carousel._instances = [];

/**
 * Push templates
 */
Carousel._templates = [];

/**
 * Carousels width for a same group
 */
Carousel._groupsWidths = {};
Carousel._groupsProcessed = [];

/**
 * Export it
 */
 export default Carousel
