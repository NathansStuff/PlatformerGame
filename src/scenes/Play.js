import Phaser from 'phaser';
import Player from '../entities/Player';
import { getEnemyTypes } from '../types';


class Play extends Phaser.Scene {

    constructor(config) {
        super('PlayScene');
        this.config = config;
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
    }

    create() {
        const map = this.createMap();
        const layers = this.createLayers(map);
        const playerZones = this.getPlayerZones(layers.playerZones);
        const player = this.createPlayer(playerZones.start);
        const enemies = this.createEnemies(layers.enemySpawns);
        
        this.createEnemyColliders(enemies, {
            colliders: {
                platformColliders: layers.platformColliders,
                player
            }
        });
        
        this.createPlayerColliders(player, {colliders: {
            platformColliders: layers.platformColliders
            }
        });


        this.createEndOfLevel(playerZones.end, player);
        this.setupFollowupCameraOn(player);

    }

    createMap() {
        const map = this.make.tilemap({key: 'map'});
        map.addTilesetImage('main_lev_build_1', 'tiles-1');
        map.addTilesetImage('main_lev_build_2', 'tiles-2');
        return map;
    }

    createEnemies(spawnLayer) {
        const enemyTypes = getEnemyTypes();
        return spawnLayer.objects.map(spawnPoint => {
            return new enemyTypes[spawnPoint.type](this, spawnPoint.x, spawnPoint.y);
        })
    }

    createEnemyColliders(enemies, { colliders }) {
        enemies.forEach(enemy => {
            enemy
                .addCollider(colliders.platformColliders)
                .addCollider(colliders.player);
        })
    }

    createLayers(map) {
        const tileset1 = map.getTileset('main_lev_build_1');
        const tileset2 = map.getTileset('main_lev_build_2');
        const platformColliders = map.createStaticLayer('platform_colliders', [tileset1,tileset2]);

        const environment = map.createStaticLayer('environment', [tileset1, tileset2]);
        const platforms = map.createStaticLayer('platforms', [tileset1,tileset2]);

        const playerZones = map.getObjectLayer('player_zones');
        
        const enemySpawns = map.getObjectLayer('enemy_spawns');

        platformColliders.setCollisionByExclusion(-1, true);

        return { environment, platforms, platformColliders, playerZones, enemySpawns };
    }

    createPlayer(start) {
        return new Player(this, start.x, start.y);
    }

    createPlayerColliders(player, {colliders}) {
        player 
            .addCollider(colliders.platformColliders)
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