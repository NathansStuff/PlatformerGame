import Phaser from 'phaser';
import collidable from '../mixins/collidable';

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key) {
        super(scene, x, y, key);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Mixins
        Object.assign(this, collidable);

        this.init();
        this.initEvents();
    } 

    init() {
        this.health = 40;
        this.gravity = 500;
        this.maxPatrolDistance = 1000;
        this.damage = 10;
        this.currentPatrolDistance = 0;
        this.speed = 100;
        this.timeFromLastTurn = 0;
        this.setVelocityX(this.speed);
        this.rayGraphics = this.scene.add.graphics( {
            linestyle: {
            width: 2, color: 0xaa00aa}
        });
        this.platformCollidersLayer = null;
        this.body.setGravityY(this.gravity);
        this.setSize(20, 45);
        this.setOffset(7, 20);
        this.setCollideWorldBounds(true);
        this.setImmovable(true);
        this.setOrigin(0.5, 1)
    }

    initEvents() {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this)
    }

    update(time) {
        this.patrol(time);
        
    }

    patrol(time, delta) {
        if (!this.body || !this.body.onFloor()) {return}
        
        this.currentPatrolDistance += 1;
        
        const {ray, hasHit} = this.raycast(this.body, this.platformCollidersLayer, {steepness: 0.4});

        if ( (!hasHit || this.currentPatrolDistance >= this.maxPatrolDistance) && (this.timeFromLastTurn + 700 < time)  ) {
            this.setFlipX(!this.flipX);
            this.setVelocityX(this.speed = -this.speed);
            // console.log(this.timeFromLastTurn);
            this.timeFromLastTurn = time;
        }

        this.rayGraphics.clear();
        this.rayGraphics.strokeLineShape(ray);
    }

    setPlatformColliders(platformCollidersLayer) {
        this.platformCollidersLayer = platformCollidersLayer;
    }

    takesHit(source) {
        this.health -= source.damage;
    
        source.setActive(false);
        source.setVisible(false);
        
        console.log(this.health);
        if (this.health <= 0) {
          console.log('Enemy is terminated');
        }
      }
}

export default Enemy;