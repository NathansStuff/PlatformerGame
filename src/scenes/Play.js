import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemies from '../groups/Enemies';
import initAnims from '../anims';
import Collectables from '../groups/Collectables';
import Hud from '../hud';


class Play extends Phaser.Scene {

    constructor(config) {
        super('PlayScene');
        this.config = config;
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
    }

    create() {
        this.score = 0;
        const map = this.createMap();
        initAnims(this.anims);

        const layers = this.createLayers(map);
        const playerZones = this.getPlayerZones(layers.playerZones);
        const player = this.createPlayer(playerZones.start);
        const enemies = this.createEnemies(layers.enemySpawns, layers.platformColliders);
        const collectables = this.createCollectables(layers.collectables);
        this.hud = new Hud(this, 0, 0);
        
        this.createEnemyColliders(enemies, {
            colliders: {
                platformColliders: layers.platformColliders,
                player
            }
        });
        
        this.createPlayerColliders(player, {colliders: {
            platformColliders: layers.platformColliders,
            projectiles: enemies.getProjectiles(),
            collectables,
            traps: layers.traps
            }
        });


        this.createEndOfLevel(playerZones.end, player);
        this.setupFollowupCameraOn(player);

    }

    drawDebug(layer) {
        const collidingTileColor = new Phaser.Display.Color(243, 134, 48, 200);

        layer.renderDebug(this.graphics, {
            tileColor: null,
            collidingTileColor
        })
    }

    finishDrawing(pointer, layer) {
        this.line.x2 = pointer.worldX;
        this.line.y2 = pointer.worldY;

        this.graphics.clear();
        this.graphics.strokeLineShape(this.line);
        
        this.tileHits = layer.getTilesWithinShape(this.line);

        if (this.tileHits.length > 0) {
        this.tileHits.forEach(tile => {
            tile.index !== -1 && tile.setCollision(true);
        })
        }

        this.drawDebug(layer)

        this.plotting = false;
    }

    createMap() {
        const map = this.make.tilemap({key: 'map'});
        map.addTilesetImage('main_lev_build_1', 'tiles-1');
        map.addTilesetImage('main_lev_build_2', 'tiles-2');
        return map;
    }

    createEnemies(spawnLayer, platformColliders) {
        const enemies = new Enemies(this);
        const enemyTypes = enemies.getTypes();

        spawnLayer.objects.forEach(spawnPoint => {
            const enemy = new enemyTypes[spawnPoint.type](this, spawnPoint.x, spawnPoint.y);

            enemy.setPlatformColliders(platformColliders);
            
            enemies.add(enemy);

        })

        return enemies;
    }

    onPlayerCollision(enemy, player) {
        player.takesHit(enemy);
    }

    onWeaponHit(entity, source) {
        entity.takesHit(source);
      }

    createEnemyColliders(enemies, { colliders }) {
        enemies
            .addCollider(colliders.platformColliders)
            .addCollider(colliders.player, this.onPlayerCollision)
            .addCollider(colliders.player.projectiles, this.onWeaponHit)
            .addOverlap(colliders.player.meleeWeapon, this.onWeaponHit);
    }

    createLayers(map) {
        const tileset1 = map.getTileset('main_lev_build_1');
        const tileset2 = map.getTileset('main_lev_build_2');
        const platformColliders = map.createStaticLayer('platform_colliders', [tileset1,tileset2]);

        const environment = map.createStaticLayer('environment', [tileset1, tileset2]).setDepth(-2);
        const platforms = map.createStaticLayer('platforms', [tileset1,tileset2]);

        const playerZones = map.getObjectLayer('player_zones');
        
        const enemySpawns = map.getObjectLayer('enemy_spawns');

        const collectables = map.getObjectLayer('collectables');

        const traps = map.createStaticLayer('traps', [tileset1,tileset2]);

        platformColliders.setCollisionByExclusion(-1, true);
        traps.setCollisionByExclusion(-1);

        return { 
            environment, 
            platforms, 
            platformColliders, 
            playerZones, 
            enemySpawns,
            collectables,
            traps 
        };
    }

    createPlayer(start) {
        return new Player(this, start.x, start.y);
    }

    createPlayerColliders(player, {colliders}) {
        player 
            .addCollider(colliders.platformColliders)
            .addCollider(colliders.projectiles, this.onWeaponHit)
            .addOverlap(colliders.collectables, this.onCollect, this)
            .addCollider(colliders.traps, () => { console.log('we got hit!')})


    }

    createCollectables(collectableLayer) {
        const collectables = new Collectables(this).setDepth(-1);
        collectables.addFromLayer(collectableLayer);
        collectables.playAnimation('diamond-shine');
        return collectables;
      }

    onCollect(entity, collectable) {
        // disableGameObject -> this will deactivate the object, default: false
        // hideGameObject -> this will hide the game object. Default: false
        this.score += collectable.score;
        this.hud.updateScoreboard(this.score);
    collectable.disableBody(true, true);
        collectable.disableBody(true, true);

      }

    setupFollowupCameraOn(player) {
        const { height, width, mapOffset, zoomFactor } = this.config;
        this.physics.world.setBounds(0,0, width + mapOffset, height + 200);
        this.cameras.main.setBounds(0,0, width + mapOffset, height).setZoom(zoomFactor);
        this.cameras.main.startFollow(player);
    }

    getPlayerZones(playerZonesLayer) {
        const playerZones = playerZonesLayer.objects;
        return {
            start: playerZones[0],
            end: playerZones[1]
        }
    }

    createEndOfLevel(end, player) {
        const endOfLevel = this.physics.add.sprite(end.x, end.y, 'end')
            .setAlpha(0)
            .setOrigin(0.5)
            .setSize(5, 200);

        const endOfLevelOverlap = this.physics.add.overlap(player, endOfLevel, () => {
            endOfLevelOverlap.active = false;
            console.log('game over');
        })
    }
}

export default Play;